// ── Layer 2: Exact Cache (Valkey/Redis) ─────────────────────────────
//
// Stores exact query→response pairs with category-based TTLs.
// Hit ratio: ~20-30% for productivity queries (repeated daily patterns
// like "show today's tasks", "my progress", "what's next").
//
// Uses the existing Valkey instance (Redis-compatible).

import { createHash } from "node:crypto";
import { logger } from "../../../middleware/logger.js";

const log = logger.child({ module: "ai-exact-cache" });

// ── TTLs by category (seconds) ──────────────────────────────────────

const TTL_MAP: Readonly<Record<string, number>> = {
  list_tasks: 60,           // 1 min (task list changes frequently)
  show_progress: 300,       // 5 min
  show_schedule: 120,       // 2 min
  greeting: 3600,           // 1 hour (same greeting response)
  help: 86400,              // 24 hours (static content)
  ai_chat: 300,             // 5 min (general chat)
  ai_insights: 21600,       // 6 hours (weekly insights)
  ai_schedule: 600,         // 10 min
  decompose_task: 1800,     // 30 min
  default: 300,             // 5 min fallback
};

// ── Cache Interface ──────────────────────────────────────────────────

interface CacheEntry {
  readonly response: string;
  readonly metadata?: Record<string, unknown>;
}

// In-memory fallback when Valkey is unavailable
const memoryCache = new Map<string, { value: CacheEntry; expiresAt: number }>();
const MAX_MEMORY_ENTRIES = 1000;

// ── Valkey Connection (lazy) ─────────────────────────────────────────

let valkey: { get: (key: string) => Promise<string | null>; set: (key: string, value: string, options?: { EX?: number }) => Promise<unknown> } | null = null;

async function getValkey() {
  if (valkey) return valkey;

  try {
    const redisUrl = process.env.REDIS_URL ?? "redis://localhost:6379";
    // Dynamic import to avoid hard dependency
    const { Redis } = await import("ioredis");
    const client = new Redis(redisUrl, {
      maxRetriesPerRequest: 1,
      connectTimeout: 2000,
      lazyConnect: true,
    });
    await client.connect();
    valkey = {
      get: (key: string) => client.get(key),
      set: (key: string, value: string, options?: { EX?: number }) =>
        options?.EX ? client.set(key, value, "EX", options.EX) : client.set(key, value),
    };
    log.info("Connected to Valkey for AI exact cache");
    return valkey;
  } catch {
    log.warn("Valkey unavailable — using in-memory cache");
    return null;
  }
}

// ── Hash Functions ───────────────────────────────────────────────────

/**
 * Tier A: Exact query hash (catches identical queries).
 */
function exactCacheKey(userId: string, query: string): string {
  const hash = createHash("sha256")
    .update(query.toLowerCase().trim())
    .digest("hex");
  return `ai:exact:${userId}:${hash}`;
}

/**
 * Tier B: Intent-canonical key (catches same intent with different wording).
 * e.g., "show my tasks" and "list my tasks" both map to "list_tasks:{}".
 * This avoids redundant LLM calls for semantically identical queries.
 */
function intentCacheKey(
  userId: string,
  intent: string,
  entities: Record<string, string>,
): string {
  // Sort entity keys for deterministic hashing
  const sortedEntities = Object.keys(entities)
    .sort()
    .map((k) => `${k}=${entities[k]}`)
    .join("&");
  const canonical = `${intent}:${sortedEntities}`;
  const hash = createHash("sha256").update(canonical).digest("hex");
  return `ai:intent:${userId}:${hash}`;
}

// ── Public API ──────────────────────────────────────────────────────

/**
 * Look up an exact match in the cache.
 * Tries Tier A (exact query hash) first, then Tier B (intent-canonical) if provided.
 */
export async function getFromCache(
  userId: string,
  query: string,
  intent?: string,
  entities?: Record<string, string>,
): Promise<CacheEntry | null> {
  // Tier A: exact query match
  const key = exactCacheKey(userId, query);

  // Try Valkey first
  const client = await getValkey();
  if (client) {
    try {
      const raw = await client.get(key);
      if (raw) {
        log.debug({ key }, "Exact cache HIT (Valkey)");
        return JSON.parse(raw) as CacheEntry;
      }
    } catch {
      // Fall through to memory cache
    }
  }

  // Memory cache fallback
  const memEntry = memoryCache.get(key);
  if (memEntry && memEntry.expiresAt > Date.now()) {
    log.debug({ key }, "Exact cache HIT (memory)");
    return memEntry.value;
  }

  // Expired entry — clean up
  if (memEntry) memoryCache.delete(key);

  // Tier B: intent-canonical match (same intent, different wording)
  if (intent && entities) {
    const intentKey = intentCacheKey(userId, intent, entities);

    if (client) {
      try {
        const raw = await client.get(intentKey);
        if (raw) {
          log.debug({ intentKey }, "Intent-canonical cache HIT (Valkey)");
          return JSON.parse(raw) as CacheEntry;
        }
      } catch {
        // Fall through
      }
    }

    const memIntentEntry = memoryCache.get(intentKey);
    if (memIntentEntry && memIntentEntry.expiresAt > Date.now()) {
      log.debug({ intentKey }, "Intent-canonical cache HIT (memory)");
      return memIntentEntry.value;
    }
    if (memIntentEntry) memoryCache.delete(intentKey);
  }

  return null;
}

/**
 * Store a response in the exact cache.
 * Stores under both Tier A (exact) and Tier B (intent-canonical) keys.
 */
export async function setInCache(
  userId: string,
  query: string,
  category: string,
  entry: CacheEntry,
  intent?: string,
  entities?: Record<string, string>,
): Promise<void> {
  const key = exactCacheKey(userId, query);
  const ttl = TTL_MAP[category] ?? TTL_MAP.default;
  const serialized = JSON.stringify(entry);

  // Try Valkey for Tier A
  const client = await getValkey();
  let valkeyOk = false;
  if (client) {
    try {
      await client.set(key, serialized, { EX: ttl });
      valkeyOk = true;
    } catch {
      // Fall through to memory cache
    }
  }

  // Memory cache fallback (only if Valkey failed)
  if (!valkeyOk) {
    if (memoryCache.size >= MAX_MEMORY_ENTRIES) {
      // Evict entry closest to expiry (pseudo-LRU)
      let oldestKey: string | null = null;
      let oldestExpiry = Infinity;
      for (const [k, v] of memoryCache) {
        if (v.expiresAt < oldestExpiry) { oldestExpiry = v.expiresAt; oldestKey = k; }
      }
      if (oldestKey) memoryCache.delete(oldestKey);
    }
    memoryCache.set(key, {
      value: entry,
      expiresAt: Date.now() + ttl * 1000,
    });
  }

  // Tier B: intent-canonical key (ALWAYS write, regardless of Tier A result)
  if (intent && entities) {
    const intentKey = intentCacheKey(userId, intent, entities);
    if (client) {
      client.set(intentKey, serialized, { EX: ttl }).catch(() => {});
    }
    // Always store in memory too for fast lookups
    memoryCache.set(intentKey, {
      value: entry,
      expiresAt: Date.now() + ttl * 1000,
    });
  }
}

/**
 * Invalidate cache entries for a user (e.g., after task CRUD).
 */
export async function invalidateUserCache(userId: string): Promise<void> {
  // Memory cache: delete all entries for this user (both tiers)
  for (const key of memoryCache.keys()) {
    if (key.startsWith(`ai:exact:${userId}:`) || key.startsWith(`ai:intent:${userId}:`)) {
      memoryCache.delete(key);
    }
  }

  // Valkey: can't scan efficiently, rely on TTL expiration
  // For critical invalidation, we could use a generation counter
}
