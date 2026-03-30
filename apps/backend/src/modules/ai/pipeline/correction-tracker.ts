// ── Learning from Corrections ────────────────────────────────────────
//
// Tracks user corrections to improve future AI responses.
// Three mechanisms:
//
//   A. Search Aliases — "groceries" → "Weekly grocery run" for this user
//   B. Intent Threshold Calibration — raise/lower confidence per user
//   C. Implicit Feedback — 30-second undo = false positive signal
//
// Inspired by:
//   - ChatGPT's memory update-on-correction
//   - Google Assistant's per-user vocabulary adaptation
//   - Amazon Lex's confidence threshold recommendations
//
// Storage: PostgreSQL (via audit_log for zero migration) + Valkey cache.

import { eq, and, desc, sql } from "drizzle-orm";
import { db } from "../../../db/index.js";
import { auditLog } from "../../../db/schema/index.js";
import { logger } from "../../../middleware/logger.js";

const log = logger.child({ module: "correction-tracker" });

// ── Types ──────────────────────────────────────────────────────────

export interface SearchAlias {
  readonly searchTerm: string;
  readonly correctTaskTitle: string;
  readonly correctTaskId: string;
  readonly timesUsed: number;
}

export interface IntentThreshold {
  readonly intentType: string;
  readonly currentThreshold: number;
  readonly totalTriggers: number;
  readonly falsePositives: number;
  readonly truePositives: number;
}

export interface FeedbackSignal {
  readonly feature: string;
  readonly action: "accepted" | "rejected" | "edited" | "undone";
  readonly timeToActionMs: number;
}

// ── Caches ────────────────────────────────────────────────────────

const aliasCache = new Map<string, { aliases: SearchAlias[]; expiresAt: number }>();
const thresholdCache = new Map<string, { thresholds: Map<string, IntentThreshold>; expiresAt: number }>();
const CACHE_TTL_MS = 5 * 60 * 1000; // 5 minutes

// ── A. Search Aliases ─────────────────────────────────────────────
//
// When a user corrects a fuzzy match ("No, I meant X not Y"),
// store the mapping so next time the same query resolves correctly.

/**
 * Load search aliases for a user.
 */
export async function loadAliases(userId: string): Promise<readonly SearchAlias[]> {
  const cached = aliasCache.get(userId);
  if (cached && cached.expiresAt > Date.now()) return cached.aliases;

  try {
    const rows = await db
      .select({ action: auditLog.action, metadata: auditLog.metadata })
      .from(auditLog)
      .where(
        and(
          eq(auditLog.userId, userId),
          eq(auditLog.entityType, "search_alias"),
        ),
      )
      .orderBy(desc(auditLog.createdAt))
      .limit(50);

    const aliases: SearchAlias[] = [];
    const seenTerms = new Set<string>();

    for (const row of rows) {
      if (seenTerms.has(row.action)) continue;
      seenTerms.add(row.action);
      try {
        const meta = row.metadata ? JSON.parse(row.metadata) : {};
        if (meta.deleted) continue;
        aliases.push({
          searchTerm: row.action,
          correctTaskTitle: meta.correctTaskTitle ?? "",
          correctTaskId: meta.correctTaskId ?? "",
          timesUsed: meta.timesUsed ?? 1,
        });
      } catch { continue; }
    }

    aliasCache.set(userId, { aliases, expiresAt: Date.now() + CACHE_TTL_MS });
    return aliases;
  } catch (error) {
    log.error({ error, userId }, "Failed to load search aliases");
    return [];
  }
}

/**
 * Save a search alias (user corrected a fuzzy match).
 */
export async function saveAlias(
  userId: string,
  searchTerm: string,
  correctTaskId: string,
  correctTaskTitle: string,
): Promise<void> {
  try {
    await db.insert(auditLog).values({
      userId,
      action: searchTerm.toLowerCase().trim(),
      entityType: "search_alias",
      entityId: correctTaskId,
      metadata: JSON.stringify({
        correctTaskId,
        correctTaskTitle,
        timesUsed: 1,
      }),
    });
    aliasCache.delete(userId);
    log.info({ userId, searchTerm, correctTaskTitle }, "Search alias saved");
  } catch (error) {
    log.error({ error }, "Failed to save search alias");
  }
}

/**
 * Look up an alias before running fuzzy search.
 * Returns the correct task ID if found, null otherwise.
 */
export async function lookupAlias(
  userId: string,
  searchTerm: string,
): Promise<SearchAlias | null> {
  const aliases = await loadAliases(userId);
  const normalizedTerm = searchTerm.toLowerCase().trim();

  // Exact match first
  const exact = aliases.find((a) => a.searchTerm === normalizedTerm);
  if (exact) return exact;

  // Partial match (alias is a substring of the search term or vice versa)
  const partial = aliases.find(
    (a) => normalizedTerm.includes(a.searchTerm) || a.searchTerm.includes(normalizedTerm),
  );
  return partial ?? null;
}

// ── B. Intent Threshold Calibration ──────────────────────────────
//
// Track false positive rate per user per intent.
// If too many "undo within 30s" events, raise the confidence threshold.

/**
 * Load intent thresholds for a user.
 */
export async function loadThresholds(
  userId: string,
): Promise<ReadonlyMap<string, IntentThreshold>> {
  const cached = thresholdCache.get(userId);
  if (cached && cached.expiresAt > Date.now()) return cached.thresholds;

  try {
    const rows = await db
      .select({ action: auditLog.action, metadata: auditLog.metadata })
      .from(auditLog)
      .where(
        and(
          eq(auditLog.userId, userId),
          eq(auditLog.entityType, "intent_threshold"),
        ),
      )
      .orderBy(desc(auditLog.createdAt))
      .limit(20);

    const thresholds = new Map<string, IntentThreshold>();

    for (const row of rows) {
      if (thresholds.has(row.action)) continue;
      try {
        const meta = row.metadata ? JSON.parse(row.metadata) : {};
        thresholds.set(row.action, {
          intentType: row.action,
          currentThreshold: meta.currentThreshold ?? 0.60,
          totalTriggers: meta.totalTriggers ?? 0,
          falsePositives: meta.falsePositives ?? 0,
          truePositives: meta.truePositives ?? 0,
        });
      } catch { continue; }
    }

    thresholdCache.set(userId, { thresholds, expiresAt: Date.now() + CACHE_TTL_MS });
    return thresholds;
  } catch (error) {
    log.error({ error, userId }, "Failed to load intent thresholds");
    return new Map();
  }
}

/**
 * Get the confidence threshold for a specific intent type.
 * Returns the user's calibrated threshold, or the default.
 */
export async function getThreshold(
  userId: string,
  intentType: string,
  defaultThreshold: number = 0.60,
): Promise<number> {
  const thresholds = await loadThresholds(userId);
  return thresholds.get(intentType)?.currentThreshold ?? defaultThreshold;
}

/**
 * Record a trigger event (AI performed an action).
 * Call this after every direct action.
 */
export function recordTrigger(
  userId: string,
  intentType: string,
): { triggerId: string; checkAfterMs: number } {
  const triggerId = `trigger_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
  // Return the trigger ID and the time to check for false positive
  return { triggerId, checkAfterMs: 30_000 }; // 30 seconds
}

/**
 * Record whether a trigger was a true positive or false positive.
 * Call this 30 seconds after the action (via setTimeout or BullMQ delayed job).
 */
export async function recordOutcome(
  userId: string,
  intentType: string,
  wasCorrect: boolean,
): Promise<void> {
  try {
    const thresholds = await loadThresholds(userId);
    const current = thresholds.get(intentType) ?? {
      intentType,
      currentThreshold: 0.60,
      totalTriggers: 0,
      falsePositives: 0,
      truePositives: 0,
    };

    const updated = {
      ...current,
      totalTriggers: current.totalTriggers + 1,
      falsePositives: current.falsePositives + (wasCorrect ? 0 : 1),
      truePositives: current.truePositives + (wasCorrect ? 1 : 0),
    };

    // Recalibrate every 20 triggers
    if (updated.totalTriggers % 20 === 0 && updated.totalTriggers > 0) {
      const fpRate = updated.falsePositives / updated.totalTriggers;

      if (fpRate > 0.20) {
        updated.currentThreshold = Math.min(updated.currentThreshold + 0.10, 0.95);
      } else if (fpRate > 0.10) {
        updated.currentThreshold = Math.min(updated.currentThreshold + 0.05, 0.90);
      } else if (fpRate < 0.03 && updated.totalTriggers > 50) {
        updated.currentThreshold = Math.max(updated.currentThreshold - 0.03, 0.45);
      }

      log.info({
        userId, intentType,
        fpRate: Math.round(fpRate * 100),
        newThreshold: updated.currentThreshold,
      }, "Intent threshold recalibrated");
    }

    // Save
    await db.insert(auditLog).values({
      userId,
      action: intentType,
      entityType: "intent_threshold",
      entityId: intentType,
      metadata: JSON.stringify({
        currentThreshold: updated.currentThreshold,
        totalTriggers: updated.totalTriggers,
        falsePositives: updated.falsePositives,
        truePositives: updated.truePositives,
      }),
    });

    thresholdCache.delete(userId);
  } catch (error) {
    log.error({ error, userId, intentType }, "Failed to record outcome");
  }
}

// ── C. Implicit Feedback Signals ──────────────────────────────────
//
// Track behavioral signals without user effort:
//   - Task created via AI, undone within 30s → false positive
//   - Task created via AI, title edited within 60s → partial error
//   - AI suggestion accepted, never changed → true positive

/**
 * Record a feedback signal (fire-and-forget).
 */
export function recordFeedbackSignal(
  userId: string,
  signal: FeedbackSignal,
): void {
  db.insert(auditLog).values({
    userId,
    action: `feedback.${signal.feature}.${signal.action}`,
    entityType: "ai_feedback",
    entityId: signal.feature,
    metadata: JSON.stringify({
      action: signal.action,
      timeToActionMs: signal.timeToActionMs,
    }),
  }).catch(() => {});
}

/**
 * Check if a recently created task was undone (false positive detection).
 * Call this 30 seconds after task creation via AI.
 */
export async function checkForFalsePositive(
  userId: string,
  taskId: string,
  intentType: string,
): Promise<void> {
  // Check if the task still exists and hasn't been undone
  // This is called via setTimeout in the pipeline
  try {
    const { tasks } = await import("../../../db/schema/index.js");
    const [task] = await db
      .select({ id: tasks.id, status: tasks.status })
      .from(tasks)
      .where(eq(tasks.id, taskId))
      .limit(1);

    if (!task) {
      // Task was deleted (undone) → false positive
      await recordOutcome(userId, intentType, false);
      recordFeedbackSignal(userId, {
        feature: intentType,
        action: "undone",
        timeToActionMs: 30_000,
      });
    } else {
      // Task still exists → true positive
      await recordOutcome(userId, intentType, true);
      recordFeedbackSignal(userId, {
        feature: intentType,
        action: "accepted",
        timeToActionMs: 30_000,
      });
    }
  } catch {
    // Non-critical, ignore errors
  }
}

// ── Pipeline Integration Helper ──────────────────────────────────

/**
 * Check corrections before fuzzy search.
 * Returns boosted task ID if an alias matches, null otherwise.
 */
export async function checkCorrectionsBeforeSearch(
  userId: string,
  searchTerm: string,
): Promise<{ taskId: string; taskTitle: string } | null> {
  const alias = await lookupAlias(userId, searchTerm);
  if (alias && alias.correctTaskId) {
    return { taskId: alias.correctTaskId, taskTitle: alias.correctTaskTitle };
  }
  return null;
}

/**
 * Schedule a false-positive check 30 seconds after a task action.
 * Uses setTimeout (for simplicity) — in production, use BullMQ delayed job.
 */
export function scheduleFalsePositiveCheck(
  userId: string,
  taskId: string,
  intentType: string,
): void {
  setTimeout(() => {
    checkForFalsePositive(userId, taskId, intentType).catch(() => {});
  }, 30_000);
}
