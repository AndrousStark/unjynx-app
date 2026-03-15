// ── Channel OTP Verification ────────────────────────────────────────
// Generate, send, and verify OTP codes for WhatsApp and SMS channels.
// OTPs are stored in Redis with 60s TTL. Rate-limited to 3 attempts
// per phone number per hour.
//
// Routes:
//   POST /api/v1/channels/whatsapp/verify
//   POST /api/v1/channels/sms/verify

import { Hono } from "hono";
import { zValidator } from "@hono/zod-validator";
import { authMiddleware } from "../../middleware/auth.js";
import { ok, err } from "../../types/api.js";
import { verifyOtpSchema } from "./channels.schema.js";
import { getAdapter } from "../../services/channels/adapter-registry.js";
import * as channelRepo from "./channels.repository.js";
import { logger } from "../../middleware/logger.js";
import { env } from "../../env.js";
import { z } from "zod";

const log = logger.child({ module: "channel-verification" });

// ── Configuration ───────────────────────────────────────────────────

const OTP_LENGTH = 6;
const OTP_TTL_SECONDS = 60;
const MAX_ATTEMPTS_PER_HOUR = 3;
const RATE_LIMIT_WINDOW_SECONDS = 3600;

// ── Redis Client (lazy-initialized) ─────────────────────────────────

let redisClient: RedisPort | null = null;

interface RedisPort {
  get(key: string): Promise<string | null>;
  set(key: string, value: string, mode: string, ttl: number): Promise<unknown>;
  incr(key: string): Promise<number>;
  expire(key: string, seconds: number): Promise<unknown>;
  del(key: string): Promise<unknown>;
}

function getRedis(): RedisPort {
  if (redisClient) return redisClient;

  try {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const IORedis = require("ioredis");
    redisClient = new IORedis(env.REDIS_URL, {
      maxRetriesPerRequest: 3,
      enableReadyCheck: false,
      lazyConnect: true,
    }) as RedisPort;
    return redisClient;
  } catch {
    // Fall back to in-memory store for dev/test
    log.warn("Redis unavailable, using in-memory OTP store");
    return createInMemoryRedis();
  }
}

// ── In-Memory Redis Stub (dev/test) ─────────────────────────────────

function createInMemoryRedis(): RedisPort {
  const store = new Map<string, { value: string; expiresAt: number }>();

  function cleanup(): void {
    const now = Date.now();
    for (const [key, entry] of store) {
      if (entry.expiresAt <= now) {
        store.delete(key);
      }
    }
  }

  return {
    async get(key: string): Promise<string | null> {
      cleanup();
      const entry = store.get(key);
      if (!entry || entry.expiresAt <= Date.now()) {
        store.delete(key);
        return null;
      }
      return entry.value;
    },

    async set(key: string, value: string, _mode: string, ttl: number): Promise<unknown> {
      store.set(key, {
        value,
        expiresAt: Date.now() + ttl * 1000,
      });
      return "OK";
    },

    async incr(key: string): Promise<number> {
      cleanup();
      const entry = store.get(key);
      const current = entry ? parseInt(entry.value, 10) : 0;
      const next = (isNaN(current) ? 0 : current) + 1;
      const expiresAt = entry?.expiresAt ?? Date.now() + RATE_LIMIT_WINDOW_SECONDS * 1000;
      store.set(key, { value: String(next), expiresAt });
      return next;
    },

    async expire(key: string, seconds: number): Promise<unknown> {
      const entry = store.get(key);
      if (entry) {
        store.set(key, { ...entry, expiresAt: Date.now() + seconds * 1000 });
      }
      return 1;
    },

    async del(key: string): Promise<unknown> {
      store.delete(key);
      return 1;
    },
  };
}

// ── OTP Generation ──────────────────────────────────────────────────

function generateOtp(): string {
  const digits = new Uint8Array(OTP_LENGTH);
  crypto.getRandomValues(digits);
  return Array.from(digits)
    .map((d) => d % 10)
    .join("");
}

// ── Redis Key Builders ──────────────────────────────────────────────

function otpKey(channel: string, phoneNumber: string): string {
  return `otp:${channel}:${phoneNumber}`;
}

function rateLimitKey(channel: string, phoneNumber: string): string {
  return `otp_rate:${channel}:${phoneNumber}`;
}

// ── Core OTP Logic ──────────────────────────────────────────────────

async function sendOtp(
  channel: "whatsapp" | "sms",
  phoneNumber: string,
): Promise<{
  readonly success: boolean;
  readonly error?: string;
  readonly expiresInSeconds?: number;
}> {
  const redis = getRedis();

  // Rate limit check
  const rateLimitCount = await redis.incr(rateLimitKey(channel, phoneNumber));
  if (rateLimitCount === 1) {
    await redis.expire(rateLimitKey(channel, phoneNumber), RATE_LIMIT_WINDOW_SECONDS);
  }

  if (rateLimitCount > MAX_ATTEMPTS_PER_HOUR) {
    log.warn({ channel, phoneNumber }, "OTP rate limit exceeded");
    return {
      success: false,
      error: `Too many OTP requests. Try again in ${Math.ceil(RATE_LIMIT_WINDOW_SECONDS / 60)} minutes.`,
    };
  }

  // Generate and store OTP
  const code = generateOtp();
  await redis.set(otpKey(channel, phoneNumber), code, "EX", OTP_TTL_SECONDS);

  // Send OTP via the appropriate adapter
  const adapter = getAdapter(channel);
  if (!adapter) {
    log.error({ channel }, "No adapter available for OTP delivery");
    return { success: false, error: `${channel} adapter not available` };
  }

  const message = {
    text: `Your UNJYNX verification code is: ${code}. Valid for ${OTP_TTL_SECONDS} seconds. Do not share this code.`,
  };

  const result = await adapter.send(phoneNumber, message);

  if (!result.success) {
    log.error(
      { channel, phoneNumber, errorType: result.errorType },
      "Failed to send OTP",
    );
    // Delete the stored OTP since delivery failed
    await redis.del(otpKey(channel, phoneNumber));
    return {
      success: false,
      error: `Failed to send OTP via ${channel}: ${result.errorMessage ?? "unknown error"}`,
    };
  }

  log.info(
    { channel, phoneNumber, providerMessageId: result.providerMessageId },
    "OTP sent successfully",
  );

  return { success: true, expiresInSeconds: OTP_TTL_SECONDS };
}

async function verifyOtp(
  channel: "whatsapp" | "sms",
  phoneNumber: string,
  code: string,
  userId: string,
): Promise<{
  readonly success: boolean;
  readonly error?: string;
}> {
  const redis = getRedis();

  // Retrieve stored OTP
  const storedCode = await redis.get(otpKey(channel, phoneNumber));

  if (!storedCode) {
    return { success: false, error: "OTP expired or not found. Request a new one." };
  }

  // Constant-time comparison to prevent timing attacks
  if (!timingSafeEqual(storedCode, code)) {
    return { success: false, error: "Invalid OTP code." };
  }

  // OTP is valid — delete it (single-use)
  await redis.del(otpKey(channel, phoneNumber));

  // Mark the channel as verified in the database
  await channelRepo.verifyChannel(userId, channel);

  log.info({ channel, phoneNumber, userId }, "Channel verified via OTP");

  return { success: true };
}

/**
 * Constant-time string comparison to prevent timing attacks on OTP verification.
 */
function timingSafeEqual(a: string, b: string): boolean {
  if (a.length !== b.length) return false;

  let mismatch = 0;
  for (let i = 0; i < a.length; i++) {
    mismatch |= a.charCodeAt(i) ^ b.charCodeAt(i);
  }
  return mismatch === 0;
}

// ── Send OTP Schema ─────────────────────────────────────────────────

const sendOtpSchema = z.object({
  phoneNumber: z
    .string()
    .min(4, "Phone number too short")
    .max(20, "Phone number too long")
    .regex(/^\+?\d+$/, "Invalid phone number format"),
});

// ── Routes ──────────────────────────────────────────────────────────

export const verificationRoutes = new Hono();

verificationRoutes.use("/*", authMiddleware);

// ── POST /whatsapp/send-otp ─────────────────────────────────────────
verificationRoutes.post(
  "/whatsapp/send-otp",
  zValidator("json", sendOtpSchema),
  async (c) => {
    const { phoneNumber } = c.req.valid("json");

    const result = await sendOtp("whatsapp", phoneNumber);

    if (!result.success) {
      return c.json(err(result.error ?? "Failed to send OTP"), 429);
    }

    return c.json(
      ok({
        sent: true,
        channel: "whatsapp",
        expiresInSeconds: result.expiresInSeconds,
      }),
    );
  },
);

// ── POST /whatsapp/verify ───────────────────────────────────────────
verificationRoutes.post(
  "/whatsapp/verify",
  zValidator("json", verifyOtpSchema),
  async (c) => {
    const auth = c.get("auth");
    const { phoneNumber, code } = c.req.valid("json");

    const result = await verifyOtp("whatsapp", phoneNumber, code, auth.profileId);

    if (!result.success) {
      return c.json(err(result.error ?? "Verification failed"), 400);
    }

    return c.json(ok({ verified: true, channel: "whatsapp" }));
  },
);

// ── POST /sms/send-otp ─────────────────────────────────────────────
verificationRoutes.post(
  "/sms/send-otp",
  zValidator("json", sendOtpSchema),
  async (c) => {
    const { phoneNumber } = c.req.valid("json");

    const result = await sendOtp("sms", phoneNumber);

    if (!result.success) {
      return c.json(err(result.error ?? "Failed to send OTP"), 429);
    }

    return c.json(
      ok({
        sent: true,
        channel: "sms",
        expiresInSeconds: result.expiresInSeconds,
      }),
    );
  },
);

// ── POST /sms/verify ────────────────────────────────────────────────
verificationRoutes.post(
  "/sms/verify",
  zValidator("json", verifyOtpSchema),
  async (c) => {
    const auth = c.get("auth");
    const { phoneNumber, code } = c.req.valid("json");

    const result = await verifyOtp("sms", phoneNumber, code, auth.profileId);

    if (!result.success) {
      return c.json(err(result.error ?? "Verification failed"), 400);
    }

    return c.json(ok({ verified: true, channel: "sms" }));
  },
);

// ── Test Export ──────────────────────────────────────────────────────

export {
  generateOtp,
  sendOtp,
  verifyOtp,
  timingSafeEqual,
};

/**
 * Replaces the Redis client with a custom implementation (for testing).
 */
export function setRedisClient(client: RedisPort): void {
  redisClient = client;
}
