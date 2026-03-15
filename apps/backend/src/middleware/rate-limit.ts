import IORedis from "ioredis";
import { createMiddleware } from "hono/factory";
import { HTTPException } from "hono/http-exception";

import { env } from "../env.js";

const WINDOW_SECONDS = 60;
const MAX_REQUESTS = 100;
const KEY_PREFIX = "rl:";

// Lazy-initialized Valkey connection (shared across requests).
let redis: IORedis | null = null;

function getRedis(): IORedis {
  if (redis === null) {
    redis = new IORedis(env.REDIS_URL, {
      connectionName: "unjynx:rate-limit",
      lazyConnect: true,
      enableReadyCheck: false,
      maxRetriesPerRequest: 1,
      retryStrategy(times: number): number | null {
        if (times > 3) return null; // stop retrying after 3 attempts
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

function getClientIp(c: { req: { header: (name: string) => string | undefined } }): string {
  return (
    c.req.header("cf-connecting-ip") ??
    c.req.header("x-real-ip") ??
    c.req.header("x-forwarded-for")?.split(",")[0]?.trim() ??
    "127.0.0.1"
  );
}

export const rateLimitMiddleware = createMiddleware(async (c, next) => {
  const ip = getClientIp(c);
  const key = `${KEY_PREFIX}${ip}`;

  try {
    const client = getRedis();

    // Atomic INCR + EXPIRE NX in a single pipeline (no race window)
    const pipeline = client.pipeline();
    pipeline.incr(key);
    pipeline.expire(key, WINDOW_SECONDS, "NX"); // NX = only set TTL if none exists
    pipeline.ttl(key);
    const results = await pipeline.exec();

    if (results === null) {
      // Pipeline failed — allow request through (fail-open)
      c.header("X-RateLimit-Limit", String(MAX_REQUESTS));
      await next();
      return;
    }

    const count = (results[0]?.[1] as number) ?? 1;
    const ttl = (results[2]?.[1] as number) ?? WINDOW_SECONDS;

    c.header("X-RateLimit-Limit", String(MAX_REQUESTS));

    if (count > MAX_REQUESTS) {
      const retryAfter = ttl > 0 ? ttl : WINDOW_SECONDS;
      c.header("Retry-After", String(retryAfter));
      c.header("X-RateLimit-Remaining", "0");
      throw new HTTPException(429, { message: "Too many requests" });
    }

    c.header("X-RateLimit-Remaining", String(Math.max(0, MAX_REQUESTS - count)));
    await next();
  } catch (e) {
    if (e instanceof HTTPException) throw e;

    // Valkey unavailable — fail open (allow request through)
    c.header("X-RateLimit-Limit", String(MAX_REQUESTS));
    await next();
  }
});
