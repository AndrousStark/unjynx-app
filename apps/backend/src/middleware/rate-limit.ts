import IORedis from "ioredis";
import { createMiddleware } from "hono/factory";
import { HTTPException } from "hono/http-exception";

import { env } from "../env.js";

// ── Rate Limit Configuration ──────────────────────────────────────────
// Differentiated limits per route category (requests per window).

const WINDOW_SECONDS = 60;
const KEY_PREFIX = "rl:";

/** Default limits by category. */
const LIMITS = {
  /** Auth endpoints (login, callback, refresh, password reset) */
  auth: 10,
  /** General API for authenticated users */
  general: 100,
  /** Anonymous/unauthenticated requests */
  anonymous: 30,
  /** Bulk/heavy operations (import, export, data request) */
  bulk: 10,
  /** Search endpoints */
  search: 30,
} as const;

type RateLimitTier = keyof typeof LIMITS;

// ── Route → Tier Mapping ──────────────────────────────────────────────

function resolveRateLimitTier(path: string, hasAuth: boolean): RateLimitTier {
  // Auth endpoints
  if (path.includes("/auth/callback") ||
      path.includes("/auth/refresh") ||
      path.includes("/auth/forgot-password") ||
      path.includes("/auth/reset-password") ||
      path.includes("/auth/logout") ||
      path.includes("/auth/login") ||
      path.includes("/auth/social") ||
      path.includes("/auth/verify-email") ||
      path.includes("/auth/resend-verification")) {
    return "auth";
  }

  // Bulk/heavy operations
  if (path.includes("/import/") ||
      path.includes("/export/") ||
      path.includes("/data/request") ||
      path.includes("/data/account")) {
    return "bulk";
  }

  // Search endpoints
  if (path.includes("/search") || path.includes("?q=")) {
    return "search";
  }

  // General authenticated vs anonymous
  return hasAuth ? "general" : "anonymous";
}

// ── Redis Client ──────────────────────────────────────────────────────

let redis: IORedis | null = null;

function getRedis(): IORedis {
  if (redis === null) {
    redis = new IORedis(env.REDIS_URL, {
      connectionName: "unjynx:rate-limit",
      lazyConnect: true,
      enableReadyCheck: false,
      maxRetriesPerRequest: 1,
      retryStrategy(times: number): number | null {
        if (times > 3) return null;
        return Math.min(times * 100, 1000);
      },
    });
    redis.on("error", () => {
      // Swallow connection errors — middleware falls through on failure.
    });
  }
  return redis;
}

/** Override for testing — inject a mock/stub Redis instance. */
export function setRedisForTest(client: IORedis | null): void {
  redis = client;
}

// ── Client IP Resolution ──────────────────────────────────────────────

function getClientIp(c: { req: { header: (name: string) => string | undefined } }): string {
  return (
    c.req.header("cf-connecting-ip") ??
    c.req.header("x-real-ip") ??
    c.req.header("x-forwarded-for")?.split(",")[0]?.trim() ??
    "127.0.0.1"
  );
}

// ── Middleware ─────────────────────────────────────────────────────────

export const rateLimitMiddleware = createMiddleware(async (c, next) => {
  const ip = getClientIp(c);
  const path = c.req.path;
  const hasAuth = !!c.req.header("Authorization");
  const tier = resolveRateLimitTier(path, hasAuth);
  const maxRequests = LIMITS[tier];

  // Use tier-specific key to avoid cross-contamination
  const key = `${KEY_PREFIX}${tier}:${ip}`;

  try {
    const client = getRedis();

    const pipeline = client.pipeline();
    pipeline.incr(key);
    pipeline.expire(key, WINDOW_SECONDS, "NX");
    pipeline.ttl(key);
    const results = await pipeline.exec();

    if (results === null) {
      c.header("X-RateLimit-Limit", String(maxRequests));
      c.header("X-RateLimit-Tier", tier);
      await next();
      return;
    }

    const count = (results[0]?.[1] as number) ?? 1;
    const ttl = (results[2]?.[1] as number) ?? WINDOW_SECONDS;

    c.header("X-RateLimit-Limit", String(maxRequests));
    c.header("X-RateLimit-Tier", tier);

    if (count > maxRequests) {
      const retryAfter = ttl > 0 ? ttl : WINDOW_SECONDS;
      c.header("Retry-After", String(retryAfter));
      c.header("X-RateLimit-Remaining", "0");
      throw new HTTPException(429, { message: "Too many requests" });
    }

    c.header("X-RateLimit-Remaining", String(Math.max(0, maxRequests - count)));
    await next();
  } catch (e) {
    if (e instanceof HTTPException) throw e;

    // Valkey unavailable — fail open (allow request through)
    c.header("X-RateLimit-Limit", String(maxRequests));
    c.header("X-RateLimit-Tier", tier);
    await next();
  }
});
