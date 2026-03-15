import { createMiddleware } from "hono/factory";

/**
 * Stripe-style Idempotency-Key middleware.
 *
 * When a request includes an `Idempotency-Key` header:
 * 1. Check if we've seen this key before
 * 2. If yes, return the cached response (prevents duplicate operations)
 * 3. If no, process the request, cache the response, return it
 *
 * Storage: In-memory Map for dev. Swap to Valkey/Redis in production
 * for multi-instance deployments.
 *
 * TTL: 24 hours (standard for payment/mutation idempotency)
 * Only applies to: POST, PATCH, PUT, DELETE methods
 */

interface CachedResponse {
  readonly status: number;
  readonly body: string;
  readonly contentType: string;
  readonly createdAt: number;
}

const IDEMPOTENCY_TTL_MS = 24 * 60 * 60_000; // 24 hours
const PRUNE_INTERVAL_MS = 60 * 60_000; // Prune every hour
const MAX_ENTRIES = 10_000; // Prevent unbounded growth

// In-memory store: idempotency key -> cached response
const store = new Map<string, CachedResponse>();
let lastPrune = Date.now();

function pruneExpired(now: number): void {
  if (now - lastPrune < PRUNE_INTERVAL_MS) return;
  lastPrune = now;

  for (const [key, entry] of store) {
    if (now - entry.createdAt > IDEMPOTENCY_TTL_MS) {
      store.delete(key);
    }
  }
}

// Set of methods that support idempotency
const IDEMPOTENT_METHODS = new Set(["POST", "PATCH", "PUT", "DELETE"]);

export const idempotencyMiddleware = createMiddleware(async (c, next) => {
  const method = c.req.method;

  // Only apply to mutation methods
  if (!IDEMPOTENT_METHODS.has(method)) {
    await next();
    return;
  }

  const idempotencyKey = c.req.header("Idempotency-Key");

  // No key provided — process normally
  if (!idempotencyKey) {
    await next();
    return;
  }

  // Validate key format (UUID or reasonable string)
  if (idempotencyKey.length > 256) {
    return c.json(
      { success: false, data: null, error: "Idempotency-Key too long (max 256 chars)" },
      400,
    );
  }

  const now = Date.now();
  pruneExpired(now);

  // Namespace by method + path to prevent cross-endpoint collisions
  const cacheKey = `${method}:${c.req.path}:${idempotencyKey}`;

  // Check cache for existing response
  const cached = store.get(cacheKey);
  if (cached && now - cached.createdAt < IDEMPOTENCY_TTL_MS) {
    // Return the cached response with idempotency indicator
    c.header("Idempotency-Replayed", "true");
    c.header("Content-Type", cached.contentType);
    return c.body(cached.body, cached.status as 200);
  }

  // Process the request
  await next();

  // Cache the response (only for successful mutations)
  const status = c.res.status;
  if (status >= 200 && status < 500) {
    // Clone response body for caching
    const clonedRes = c.res.clone();
    const body = await clonedRes.text();
    const contentType = c.res.headers.get("Content-Type") ?? "application/json";

    // Enforce max entries to prevent memory issues
    if (store.size >= MAX_ENTRIES) {
      // Evict oldest entry
      const oldestKey = store.keys().next().value;
      if (oldestKey !== undefined) {
        store.delete(oldestKey);
      }
    }

    store.set(cacheKey, {
      status,
      body,
      contentType,
      createdAt: now,
    });
  }
});

/**
 * Get the current cache size (for testing/monitoring).
 */
export function getIdempotencyCacheSize(): number {
  return store.size;
}

/**
 * Clear the idempotency cache (for testing).
 */
export function clearIdempotencyCache(): void {
  store.clear();
}
