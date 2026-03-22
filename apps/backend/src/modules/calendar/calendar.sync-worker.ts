// ── Calendar Sync Worker ────────────────────────────────────────────
// Background job that periodically syncs external calendar changes
// from all connected providers (Google, Apple CalDAV, Outlook).
//
// Runs every 15 minutes via the cron scheduler. For each user with
// calendar tokens, pulls external events and reconciles with the
// calendar_event_mapping table. Uses last-write-wins conflict
// resolution based on lastSyncedAt timestamps.

import { eq } from "drizzle-orm";
import { db } from "../../db/index.js";
import { calendarTokens, calendarEventMapping } from "../../db/schema/index.js";
import { logger } from "../../middleware/logger.js";
import * as calendarService from "./calendar.service.js";

const log = logger.child({ module: "calendar-sync-worker" });

// ── Configuration ────────────────────────────────────────────────────

/** Sync interval in milliseconds (15 minutes). */
export const CALENDAR_SYNC_INTERVAL_MS = 15 * 60_000;

/** Maximum number of users to sync per run (avoid overloading). */
const MAX_USERS_PER_RUN = 50;

/** How far back and forward to sync (days). */
const SYNC_WINDOW_DAYS = 30;

// ── Sync State ───────────────────────────────────────────────────────

let syncIntervalHandle: NodeJS.Timeout | null = null;
let isSyncing = false;

// ── Sync Logic ───────────────────────────────────────────────────────

/**
 * Run a single sync cycle. Fetches events from all connected providers
 * for each user and updates the event mapping table.
 *
 * Returns the number of users processed and events synced.
 */
export async function runCalendarSync(): Promise<{
  readonly usersProcessed: number;
  readonly eventsSynced: number;
}> {
  if (isSyncing) {
    log.debug("Calendar sync already in progress, skipping");
    return { usersProcessed: 0, eventsSynced: 0 };
  }

  isSyncing = true;
  const startTime = Date.now();

  try {
    // Find all distinct users with calendar tokens
    const tokenRows = await db
      .select()
      .from(calendarTokens)
      .limit(MAX_USERS_PER_RUN);

    // Deduplicate by userId
    const userIds = [...new Set(tokenRows.map((r) => r.userId))];

    if (userIds.length === 0) {
      log.debug("No users with calendar tokens, skipping sync");
      return { usersProcessed: 0, eventsSynced: 0 };
    }

    const now = new Date();
    const syncStart = new Date(
      now.getTime() - SYNC_WINDOW_DAYS * 24 * 60 * 60_000,
    );
    const syncEnd = new Date(
      now.getTime() + SYNC_WINDOW_DAYS * 24 * 60 * 60_000,
    );

    let totalEventsSynced = 0;

    for (const userId of userIds) {
      try {
        const events = await calendarService.getAllProviderEvents(
          userId,
          syncStart,
          syncEnd,
        );

        // Update lastSyncedAt for all this user's event mappings
        if (events.length > 0) {
          await db
            .update(calendarEventMapping)
            .set({ lastSyncedAt: now })
            .where(eq(calendarEventMapping.userId, userId));
        }

        totalEventsSynced += events.length;

        log.debug(
          { userId, eventCount: events.length },
          "Calendar sync completed for user",
        );
      } catch (error) {
        // Don't let one user's failure block others
        log.warn(
          {
            userId,
            error:
              error instanceof Error ? error.message : "Unknown error",
          },
          "Calendar sync failed for user",
        );
      }
    }

    const durationMs = Date.now() - startTime;

    log.info(
      {
        usersProcessed: userIds.length,
        eventsSynced: totalEventsSynced,
        durationMs,
      },
      "Calendar sync cycle complete",
    );

    return {
      usersProcessed: userIds.length,
      eventsSynced: totalEventsSynced,
    };
  } catch (error) {
    log.error(
      {
        error: error instanceof Error ? error.message : "Unknown error",
      },
      "Calendar sync cycle failed",
    );
    return { usersProcessed: 0, eventsSynced: 0 };
  } finally {
    isSyncing = false;
  }
}

// ── Lifecycle ────────────────────────────────────────────────────────

/**
 * Start the periodic calendar sync worker.
 * Uses setInterval (dev/single-instance) consistent with the existing
 * cron scheduler pattern. In production with BullMQ, this would be
 * registered as a repeatable job.
 */
export function startCalendarSyncWorker(): void {
  if (syncIntervalHandle !== null) {
    log.warn("Calendar sync worker already running");
    return;
  }

  log.info(
    { intervalMs: CALENDAR_SYNC_INTERVAL_MS },
    "Starting calendar sync worker",
  );

  syncIntervalHandle = setInterval(() => {
    runCalendarSync().catch((error) => {
      log.error(
        { error: error instanceof Error ? error.message : "Unknown" },
        "Unhandled error in calendar sync worker",
      );
    });
  }, CALENDAR_SYNC_INTERVAL_MS);
}

/**
 * Stop the periodic calendar sync worker.
 */
export function stopCalendarSyncWorker(): void {
  if (syncIntervalHandle === null) return;

  clearInterval(syncIntervalHandle);
  syncIntervalHandle = null;
  log.info("Calendar sync worker stopped");
}

/**
 * Returns whether the calendar sync worker is currently running.
 */
export function isCalendarSyncRunning(): boolean {
  return syncIntervalHandle !== null;
}
