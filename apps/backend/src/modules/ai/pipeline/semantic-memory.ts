// ── Tier 3: Semantic Memory (PostgreSQL) ─────────────────────────────
//
// Persistent long-term facts about the user, extracted from conversations.
// Examples: "prefers WhatsApp", "works 10am-6pm", "team lead is Priya"
//
// Inspired by:
//   - ChatGPT's memory (flat list of user facts, always injected)
//   - Mem0's ADD/UPDATE/DELETE operations (structured memory management)
//   - Amazon Bedrock's semantic memory layer
//
// Storage: PostgreSQL (Neon) via Drizzle ORM.
// Facts are always injected into the LLM system prompt (~150 tokens for 20-40 facts).

import { eq, and, desc } from "drizzle-orm";
import { db } from "../../../db/index.js";
import { auditLog } from "../../../db/schema/index.js";
import { logger } from "../../../middleware/logger.js";

const log = logger.child({ module: "semantic-memory" });

// ── Types ──────────────────────────────────────────────────────────

export interface MemoryFact {
  readonly category: string;
  readonly key: string;
  readonly value: string;
  readonly confidence: number;
  readonly source: "explicit" | "extracted" | "observed";
}

// ── In-Memory Cache (per-user, TTL 10 min) ────────────────────────
// Since facts change rarely, cache aggressively.

interface CachedFacts {
  readonly facts: MemoryFact[];
  readonly expiresAt: number;
}

const factsCache = new Map<string, CachedFacts>();
const CACHE_TTL_MS = 10 * 60 * 1000; // 10 minutes

// ── Fact Categories ──────────────────────────────────────────────

const VALID_CATEGORIES = new Set([
  "preference",    // "prefers WhatsApp", "likes brief responses"
  "schedule",      // "works 10am-6pm", "no meetings before 10am"
  "team",          // "team lead is Priya", "works with Arjun"
  "professional",  // "software developer", "works at METAminds"
  "personal",      // "name is Aniruddh", "based in Delhi"
  "productivity",  // "most productive 9-11am", "averages 5 tasks/day"
  "channel",       // "prefers WhatsApp for urgent", "email for summaries"
  "planning",      // "prefers guided planning", "estimates are 1.3x optimistic"
]);

// ── Storage via Audit Log (lightweight, no new table needed) ──────
// We store facts as audit log entries with entityType="user_memory".
// This avoids a DB migration and leverages existing infrastructure.
// For production scale (>50K users), migrate to a dedicated table.

async function loadFactsFromDB(userId: string): Promise<MemoryFact[]> {
  try {
    const rows = await db
      .select({
        action: auditLog.action,       // category:key format
        metadata: auditLog.metadata,    // JSON with value, confidence, source
      })
      .from(auditLog)
      .where(
        and(
          eq(auditLog.userId, userId),
          eq(auditLog.entityType, "user_memory"),
        ),
      )
      .orderBy(desc(auditLog.createdAt))
      .limit(50);

    const facts: MemoryFact[] = [];
    const seenKeys = new Set<string>();

    for (const row of rows) {
      // Deduplicate: keep only the latest per key
      if (seenKeys.has(row.action)) continue;
      seenKeys.add(row.action);

      try {
        const meta = row.metadata ? JSON.parse(row.metadata) : {};
        if (meta.deleted) continue; // Skip deleted facts

        const [category, key] = row.action.split(":", 2);
        if (!category || !key) continue;

        facts.push({
          category,
          key,
          value: meta.value ?? "",
          confidence: meta.confidence ?? 1.0,
          source: meta.source ?? "extracted",
        });
      } catch {
        continue;
      }
    }

    return facts;
  } catch (error) {
    log.error({ error, userId }, "Failed to load semantic memory");
    return [];
  }
}

async function saveFactToDB(
  userId: string,
  fact: MemoryFact,
): Promise<void> {
  try {
    await db.insert(auditLog).values({
      userId,
      action: `${fact.category}:${fact.key}`,
      entityType: "user_memory",
      entityId: fact.key,
      metadata: JSON.stringify({
        value: fact.value,
        confidence: fact.confidence,
        source: fact.source,
      }),
    });
  } catch (error) {
    log.error({ error, userId, key: fact.key }, "Failed to save memory fact");
  }
}

async function deleteFactFromDB(
  userId: string,
  category: string,
  key: string,
): Promise<void> {
  try {
    // Soft-delete: insert a tombstone entry
    await db.insert(auditLog).values({
      userId,
      action: `${category}:${key}`,
      entityType: "user_memory",
      entityId: key,
      metadata: JSON.stringify({ deleted: true }),
    });
  } catch (error) {
    log.error({ error, userId, key }, "Failed to delete memory fact");
  }
}

// ── Public API ──────────────────────────────────────────────────────

/**
 * Load all memory facts for a user (cached).
 */
export async function loadFacts(userId: string): Promise<readonly MemoryFact[]> {
  const cached = factsCache.get(userId);
  if (cached && cached.expiresAt > Date.now()) {
    return cached.facts;
  }

  const facts = await loadFactsFromDB(userId);
  factsCache.set(userId, { facts, expiresAt: Date.now() + CACHE_TTL_MS });
  return facts;
}

/**
 * Add or update a memory fact.
 */
export async function upsertFact(
  userId: string,
  fact: MemoryFact,
): Promise<void> {
  await saveFactToDB(userId, fact);
  // Invalidate cache
  factsCache.delete(userId);
  log.info({ userId, category: fact.category, key: fact.key }, "Memory fact saved");
}

/**
 * Delete a memory fact.
 */
export async function deleteFact(
  userId: string,
  category: string,
  key: string,
): Promise<void> {
  await deleteFactFromDB(userId, category, key);
  factsCache.delete(userId);
  log.info({ userId, category, key }, "Memory fact deleted");
}

/**
 * Serialize all facts to a compact string for LLM context injection.
 * Target: ~100-150 tokens for 20-40 facts.
 */
export function serializeFacts(facts: readonly MemoryFact[]): string {
  if (facts.length === 0) return "";

  const lines = facts
    .filter((f) => f.confidence >= 0.5)
    .map((f) => `- ${f.value}`)
    .slice(0, 30); // Max 30 facts

  return `User Knowledge:\n${lines.join("\n")}`;
}

// ── Preference Extraction from Natural Language ──────────────────

/**
 * Detect if a user message contains an explicit preference declaration.
 * Returns the extracted fact or null.
 *
 * Patterns: "I prefer...", "always...", "never...", "remember:...",
 * "my X is Y", "from now on...", "don't ever..."
 */
export function extractPreference(text: string): MemoryFact | null {
  const lower = text.toLowerCase().trim();

  // "Remember: [fact]" / "Remember that [fact]"
  const rememberMatch = lower.match(
    /^(?:remember|note|save|learn|know)\s*(?:that|:)?\s*(.+)/i,
  );
  if (rememberMatch) {
    return {
      category: "preference",
      key: generateKey(rememberMatch[1]),
      value: rememberMatch[1].trim(),
      confidence: 1.0,
      source: "explicit",
    };
  }

  // "I prefer X" / "I like X" / "I'd rather X"
  const preferMatch = lower.match(
    /^i\s+(?:prefer|like|want|love|enjoy|'d\s+rather)\s+(.+)/i,
  );
  if (preferMatch) {
    return {
      category: "preference",
      key: generateKey(preferMatch[1]),
      value: preferMatch[1].trim(),
      confidence: 1.0,
      source: "explicit",
    };
  }

  // "My [X] is [Y]" — factual statements
  const myMatch = lower.match(
    /^my\s+(name|role|job|title|team|lead|manager|timezone|work\s*hours?|email)\s+is\s+(.+)/i,
  );
  if (myMatch) {
    const key = myMatch[1].replace(/\s+/g, "_").toLowerCase();
    return {
      category: key.includes("team") || key.includes("lead") || key.includes("manager") ? "team" : "personal",
      key,
      value: `${myMatch[1]} is ${myMatch[2].trim()}`,
      confidence: 1.0,
      source: "explicit",
    };
  }

  // "Always [do X]" / "Never [do X]" / "Don't ever [do X]"
  const alwaysNeverMatch = lower.match(
    /^(?:always|never|don'?t\s+ever|from\s+now\s+on)\s+(.+)/i,
  );
  if (alwaysNeverMatch) {
    return {
      category: "preference",
      key: generateKey(alwaysNeverMatch[1]),
      value: text.trim(), // Keep original casing
      confidence: 1.0,
      source: "explicit",
    };
  }

  // Channel preferences: "use WhatsApp/Telegram/email for..."
  const channelMatch = lower.match(
    /(?:use|send\s+(?:via|through|on))\s+(whatsapp|telegram|email|sms|slack|discord|push)\s+(?:for\s+)?(.+)/i,
  );
  if (channelMatch) {
    return {
      category: "channel",
      key: `channel_${channelMatch[2].replace(/\s+/g, "_").slice(0, 30)}`,
      value: `Use ${channelMatch[1]} for ${channelMatch[2].trim()}`,
      confidence: 1.0,
      source: "explicit",
    };
  }

  // Work hours: "I work from X to Y" / "my hours are X-Y"
  const hoursMatch = lower.match(
    /(?:i\s+work|my\s+(?:work\s+)?hours?\s+(?:are|is))\s+(?:from\s+)?(\d{1,2})\s*(?:am|pm|:00)?\s*(?:to|-)\s*(\d{1,2})\s*(?:am|pm|:00)?/i,
  );
  if (hoursMatch) {
    return {
      category: "schedule",
      key: "work_hours",
      value: `Works from ${hoursMatch[1]} to ${hoursMatch[2]}`,
      confidence: 1.0,
      source: "explicit",
    };
  }

  return null;
}

/**
 * Generate a stable key from a fact value (for deduplication).
 */
function generateKey(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, "")
    .replace(/\s+/g, "_")
    .slice(0, 50);
}

/**
 * Check if a message contains a preference declaration.
 */
export function isPreferenceDeclaration(text: string): boolean {
  return extractPreference(text) !== null;
}
