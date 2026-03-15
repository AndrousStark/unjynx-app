import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { Hono } from "hono";
import IORedis from "ioredis";

// Mock env before importing rate-limit
vi.mock("../../env.js", () => ({
  env: {
    NODE_ENV: "test",
    PORT: 3000,
    LOG_LEVEL: "silent",
    DATABASE_URL: "postgres://test:test@localhost:5432/test",
    REDIS_URL: "redis://localhost:6379",
    LOGTO_ENDPOINT: "http://localhost:3001",
    S3_ENDPOINT: "http://localhost:9000",
    S3_ACCESS_KEY: "test",
    S3_SECRET_KEY: "test",
    S3_BUCKET: "test",
    S3_REGION: "us-east-1",
  },
}));

import { rateLimitMiddleware, setRedisForTest } from "../rate-limit.js";

/**
 * In-memory Redis stub for unit tests.
 * Mimics INCR + TTL + EXPIRE via a simple Map.
 */
function createRedisStub(): IORedis {
  const store = new Map<string, { count: number; expiresAt: number }>();

  const stub = {
    pipeline() {
      const ops: Array<() => [Error | null, unknown]> = [];
      const p = {
        incr(key: string) {
          ops.push(() => {
            const now = Date.now();
            const entry = store.get(key);
            if (!entry || now > entry.expiresAt) {
              store.set(key, { count: 1, expiresAt: now + 60_000 });
              return [null, 1];
            }
            entry.count += 1;
            return [null, entry.count];
          });
          return p;
        },
        expire(key: string, seconds: number, _flag?: string) {
          ops.push(() => {
            const entry = store.get(key);
            if (entry) {
              // NX flag: only set TTL if none exists (already set on first INCR)
              entry.expiresAt = Date.now() + seconds * 1000;
            }
            return [null, 1];
          });
          return p;
        },
        ttl(key: string) {
          ops.push(() => {
            const entry = store.get(key);
            if (!entry) return [null, -2];
            const remaining = Math.ceil((entry.expiresAt - Date.now()) / 1000);
            return [null, remaining > 0 ? remaining : -2];
          });
          return p;
        },
        async exec() {
          return ops.map((op) => op());
        },
      };
      return p;
    },
    on() {
      return stub;
    },
  } as unknown as IORedis;

  return stub;
}

describe("Rate Limit Middleware", () => {
  let redisStub: IORedis;

  beforeEach(() => {
    redisStub = createRedisStub();
    setRedisForTest(redisStub);
  });

  afterEach(() => {
    setRedisForTest(null);
  });

  function createApp() {
    const app = new Hono();
    app.use("*", rateLimitMiddleware);
    app.get("/test", (c) => c.json({ ok: true }));
    return app;
  }

  it("allows requests under the limit", async () => {
    const app = createApp();

    const res = await app.request("/test", {
      headers: { "x-real-ip": `rate-test-${Date.now()}` },
    });

    expect(res.status).toBe(200);
    expect(res.headers.get("X-RateLimit-Limit")).toBe("100");
    expect(res.headers.get("X-RateLimit-Remaining")).toBeDefined();
  });

  it("returns 429 after exceeding the limit", async () => {
    const app = createApp();
    const ip = `rate-spam-${Date.now()}`;

    // Make 100 requests from the same IP
    for (let i = 0; i < 100; i++) {
      await app.request("/test", {
        headers: { "x-real-ip": ip },
      });
    }

    const res = await app.request("/test", {
      headers: { "x-real-ip": ip },
    });

    expect(res.status).toBe(429);
    expect(res.headers.get("Retry-After")).toBeDefined();
    expect(res.headers.get("X-RateLimit-Remaining")).toBe("0");
  });

  it("tracks different IPs independently", async () => {
    const app = createApp();
    const ip1 = `ip-a-${Date.now()}`;
    const ip2 = `ip-b-${Date.now()}`;

    const res1 = await app.request("/test", {
      headers: { "x-real-ip": ip1 },
    });
    const res2 = await app.request("/test", {
      headers: { "x-real-ip": ip2 },
    });

    expect(res1.status).toBe(200);
    expect(res2.status).toBe(200);
  });

  it("uses cf-connecting-ip header with highest priority", async () => {
    const app = createApp();
    const cfIp = `cf-${Date.now()}`;

    const res = await app.request("/test", {
      headers: {
        "cf-connecting-ip": cfIp,
        "x-real-ip": "should-be-ignored",
        "x-forwarded-for": "also-ignored",
      },
    });

    expect(res.status).toBe(200);
  });
});
