import { describe, it, expect, vi, beforeEach } from "vitest";
import { Hono } from "hono";

// ── Mock dependencies ───────────────────────────────────────────────

vi.mock("../../../middleware/auth.js", () => ({
  authMiddleware: vi.fn(async (c: any, next: any) => {
    c.set("auth", { profileId: "test-user-id", logtoId: "logto-123" });
    await next();
  }),
}));

const mockAdapterSend = vi.fn();
vi.mock("../../../services/channels/adapter-registry.js", () => ({
  getAdapter: vi.fn().mockImplementation((channel: string) => {
    if (channel === "nonexistent") return null;
    return {
      send: (...args: unknown[]) => mockAdapterSend(...args),
    };
  }),
}));

const mockVerifyChannel = vi.fn();
vi.mock("../channels.repository.js", () => ({
  verifyChannel: (...args: unknown[]) => mockVerifyChannel(...args),
}));

vi.mock("../../../middleware/logger.js", () => ({
  logger: {
    child: () => ({
      info: vi.fn(),
      warn: vi.fn(),
      error: vi.fn(),
      debug: vi.fn(),
    }),
  },
}));

vi.mock("../../../env.js", () => ({
  env: {
    REDIS_URL: "",
  },
}));

import {
  verificationRoutes,
  generateOtp,
  timingSafeEqual,
  sendOtp,
  verifyOtp,
  setRedisClient,
} from "../verification.js";
import { getAdapter } from "../../../services/channels/adapter-registry.js";

// ── Setup ───────────────────────────────────────────────────────────

const app = new Hono();
app.route("/", verificationRoutes);

function postJson(path: string, body: unknown) {
  return app.request(path, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
}

// ── In-Memory Redis Mock ────────────────────────────────────────────

function createMockRedis() {
  const store = new Map<string, { value: string; expiresAt: number }>();

  return {
    store,
    client: {
      get: vi.fn(async (key: string): Promise<string | null> => {
        const entry = store.get(key);
        if (!entry || entry.expiresAt <= Date.now()) {
          store.delete(key);
          return null;
        }
        return entry.value;
      }),
      set: vi.fn(async (key: string, value: string, _mode: string, ttl: number) => {
        store.set(key, { value, expiresAt: Date.now() + ttl * 1000 });
        return "OK";
      }),
      incr: vi.fn(async (key: string): Promise<number> => {
        const entry = store.get(key);
        const current = entry ? parseInt(entry.value, 10) : 0;
        const next = (isNaN(current) ? 0 : current) + 1;
        const expiresAt = entry?.expiresAt ?? Date.now() + 3600 * 1000;
        store.set(key, { value: String(next), expiresAt });
        return next;
      }),
      expire: vi.fn(async (key: string, seconds: number) => {
        const entry = store.get(key);
        if (entry) {
          store.set(key, { ...entry, expiresAt: Date.now() + seconds * 1000 });
        }
        return 1;
      }),
      del: vi.fn(async (key: string) => {
        store.delete(key);
        return 1;
      }),
    },
  };
}

// ── Tests ───────────────────────────────────────────────────────────

describe("Channel Verification", () => {
  let mockRedis: ReturnType<typeof createMockRedis>;

  beforeEach(() => {
    vi.clearAllMocks();
    mockRedis = createMockRedis();
    setRedisClient(mockRedis.client);
    mockAdapterSend.mockResolvedValue({
      success: true,
      providerMessageId: "msg-123",
    });
  });

  // ── generateOtp ──────────────────────────────────────────────────

  describe("generateOtp", () => {
    it("returns a 6-digit string", () => {
      const otp = generateOtp();
      expect(otp).toHaveLength(6);
    });

    it("contains only digits", () => {
      const otp = generateOtp();
      expect(otp).toMatch(/^\d{6}$/);
    });

    it("generates different OTPs on consecutive calls", () => {
      const otps = new Set(Array.from({ length: 10 }, () => generateOtp()));
      // At least 2 unique values in 10 attempts (statistically near-certain)
      expect(otps.size).toBeGreaterThan(1);
    });
  });

  // ── timingSafeEqual ──────────────────────────────────────────────

  describe("timingSafeEqual", () => {
    it("returns true for matching strings", () => {
      expect(timingSafeEqual("123456", "123456")).toBe(true);
    });

    it("returns false for different strings of same length", () => {
      expect(timingSafeEqual("123456", "654321")).toBe(false);
    });

    it("returns false for strings of different lengths", () => {
      expect(timingSafeEqual("1234", "123456")).toBe(false);
    });

    it("returns true for empty strings", () => {
      expect(timingSafeEqual("", "")).toBe(true);
    });
  });

  // ── sendOtp ──────────────────────────────────────────────────────

  describe("sendOtp", () => {
    it("sends OTP successfully via whatsapp", async () => {
      const result = await sendOtp("whatsapp", "+919876543210");

      expect(result.success).toBe(true);
      expect(result.expiresInSeconds).toBe(60);
      expect(mockAdapterSend).toHaveBeenCalledWith(
        "+919876543210",
        expect.objectContaining({
          text: expect.stringContaining("verification code"),
        }),
      );
    });

    it("sends OTP successfully via sms", async () => {
      const result = await sendOtp("sms", "+919876543210");

      expect(result.success).toBe(true);
      expect(result.expiresInSeconds).toBe(60);
    });

    it("rate limits after 3 requests in the same window", async () => {
      // Send 3 OTPs (all should succeed)
      await sendOtp("whatsapp", "+919876543210");
      await sendOtp("whatsapp", "+919876543210");
      await sendOtp("whatsapp", "+919876543210");

      // 4th should be rate limited
      const result = await sendOtp("whatsapp", "+919876543210");

      expect(result.success).toBe(false);
      expect(result.error).toContain("Too many OTP requests");
    });

    it("returns error when adapter is not available", async () => {
      vi.mocked(getAdapter).mockReturnValueOnce(null as any);

      const result = await sendOtp("whatsapp", "+919876543210");

      expect(result.success).toBe(false);
      expect(result.error).toContain("adapter not available");
    });

    it("deletes stored OTP when adapter send fails", async () => {
      mockAdapterSend.mockResolvedValueOnce({
        success: false,
        errorType: "provider_error",
        errorMessage: "Gupshup API down",
      });

      const result = await sendOtp("whatsapp", "+919876543210");

      expect(result.success).toBe(false);
      expect(result.error).toContain("Failed to send OTP");
      // OTP should be deleted from Redis
      expect(mockRedis.client.del).toHaveBeenCalled();
    });
  });

  // ── verifyOtp ────────────────────────────────────────────────────

  describe("verifyOtp", () => {
    it("verifies a valid OTP and marks channel as verified", async () => {
      // Store OTP first
      await mockRedis.client.set("otp:whatsapp:+919876543210", "123456", "EX", 60);
      mockVerifyChannel.mockResolvedValue({ id: "ch-1" });

      const result = await verifyOtp("whatsapp", "+919876543210", "123456", "test-user-id");

      expect(result.success).toBe(true);
      expect(mockVerifyChannel).toHaveBeenCalledWith("test-user-id", "whatsapp");
      // OTP should be deleted after use
      expect(mockRedis.client.del).toHaveBeenCalledWith("otp:whatsapp:+919876543210");
    });

    it("returns error for expired or nonexistent OTP", async () => {
      // No OTP stored
      const result = await verifyOtp("whatsapp", "+919876543210", "123456", "test-user-id");

      expect(result.success).toBe(false);
      expect(result.error).toContain("expired or not found");
    });

    it("returns error for wrong OTP code", async () => {
      await mockRedis.client.set("otp:sms:+919876543210", "123456", "EX", 60);

      const result = await verifyOtp("sms", "+919876543210", "654321", "test-user-id");

      expect(result.success).toBe(false);
      expect(result.error).toContain("Invalid OTP");
      expect(mockVerifyChannel).not.toHaveBeenCalled();
    });

    it("single-use: OTP deleted after successful verification", async () => {
      await mockRedis.client.set("otp:whatsapp:+919876543210", "111111", "EX", 60);
      mockVerifyChannel.mockResolvedValue({ id: "ch-1" });

      // First verification
      const result1 = await verifyOtp("whatsapp", "+919876543210", "111111", "test-user-id");
      expect(result1.success).toBe(true);

      // Second attempt with same code
      const result2 = await verifyOtp("whatsapp", "+919876543210", "111111", "test-user-id");
      expect(result2.success).toBe(false);
    });
  });

  // ── Route Tests ──────────────────────────────────────────────────

  describe("Routes", () => {
    describe("POST /whatsapp/send-otp", () => {
      it("returns success response for valid phone number", async () => {
        const res = await postJson("/whatsapp/send-otp", {
          phoneNumber: "+919876543210",
        });
        const body = await res.json();

        expect(res.status).toBe(200);
        expect(body.success).toBe(true);
        expect(body.data.sent).toBe(true);
        expect(body.data.channel).toBe("whatsapp");
        expect(body.data.expiresInSeconds).toBe(60);
      });

      it("returns 429 when rate limited", async () => {
        // Exhaust rate limit
        await postJson("/whatsapp/send-otp", { phoneNumber: "+919876543210" });
        await postJson("/whatsapp/send-otp", { phoneNumber: "+919876543210" });
        await postJson("/whatsapp/send-otp", { phoneNumber: "+919876543210" });

        const res = await postJson("/whatsapp/send-otp", {
          phoneNumber: "+919876543210",
        });

        expect(res.status).toBe(429);
      });

      it("returns 400 for invalid phone number format", async () => {
        const res = await postJson("/whatsapp/send-otp", {
          phoneNumber: "not-a-number",
        });

        expect(res.status).toBe(400);
      });
    });

    describe("POST /whatsapp/verify", () => {
      it("returns success when OTP is valid", async () => {
        // Pre-store OTP
        await mockRedis.client.set("otp:whatsapp:9876543210", "654321", "EX", 60);
        mockVerifyChannel.mockResolvedValue({ id: "ch-1" });

        const res = await postJson("/whatsapp/verify", {
          phoneNumber: "9876543210",
          code: "654321",
        });
        const body = await res.json();

        expect(res.status).toBe(200);
        expect(body.success).toBe(true);
        expect(body.data.verified).toBe(true);
        expect(body.data.channel).toBe("whatsapp");
      });

      it("returns 400 for wrong OTP", async () => {
        await mockRedis.client.set("otp:whatsapp:9876543210", "111111", "EX", 60);

        const res = await postJson("/whatsapp/verify", {
          phoneNumber: "9876543210",
          code: "000000",
        });

        expect(res.status).toBe(400);
      });
    });

    describe("POST /sms/send-otp", () => {
      it("returns success response for valid phone number", async () => {
        const res = await postJson("/sms/send-otp", {
          phoneNumber: "+919876543210",
        });
        const body = await res.json();

        expect(res.status).toBe(200);
        expect(body.success).toBe(true);
        expect(body.data.channel).toBe("sms");
      });
    });

    describe("POST /sms/verify", () => {
      it("returns success when OTP is valid", async () => {
        await mockRedis.client.set("otp:sms:9876543210", "789012", "EX", 60);
        mockVerifyChannel.mockResolvedValue({ id: "ch-2" });

        const res = await postJson("/sms/verify", {
          phoneNumber: "9876543210",
          code: "789012",
        });
        const body = await res.json();

        expect(res.status).toBe(200);
        expect(body.success).toBe(true);
        expect(body.data.verified).toBe(true);
        expect(body.data.channel).toBe("sms");
      });
    });
  });

  // ── setRedisClient ───────────────────────────────────────────────

  describe("setRedisClient", () => {
    it("allows injecting a custom Redis client", async () => {
      const customRedis = createMockRedis();
      setRedisClient(customRedis.client);

      await sendOtp("whatsapp", "+911111111111");

      // OTP should be stored in the custom Redis
      expect(customRedis.client.set).toHaveBeenCalled();
      const storedKey = customRedis.client.set.mock.calls[0][0];
      expect(storedKey).toBe("otp:whatsapp:+911111111111");
    });
  });
});
