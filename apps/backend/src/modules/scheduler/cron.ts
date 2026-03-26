// ── Cron Job Scheduler ──────────────────────────────────────────────
// Periodic job scheduler using BullMQ repeatable jobs.
// Orchestrates reminder checking, overdue detection, daily digest,
// and Instagram re-engagement window monitoring.
//
// In dev/test mode (no Redis), uses an in-memory interval approach.
// In production (Redis available), uses BullMQ Worker + Queue repeatables.

import { eq, and, lte, gte, isNotNull, ne } from "drizzle-orm";
import { db, contentDb } from "../../db/index.js";
import {
  tasks,
  notificationPreferences,
  notificationChannels,
  profiles,
} from "../../db/schema/index.js";
import { logger } from "../../middleware/logger.js";
import {
  planReminders,
  planOverdueAlerts,
  planDigest,
  type UserPrefs,
} from "./scheduler.service.js";
import { dispatchBatch } from "./notification-dispatcher.js";
import { runContentDelivery } from "./content-scheduler.js";
import {
  runCalendarSync,
  CALENDAR_SYNC_INTERVAL_MS,
} from "../calendar/calendar.sync-worker.js";
import { hardDeleteExpiredAccounts } from "../import-export/import-export.service.js";
import { cleanupExpiredSessions } from "../auth/session.service.js";

const log = logger.child({ module: "cron-scheduler" });

// ── Configuration ───────────────────────────────────────────────────

const REMINDER_WINDOW_MINUTES = 2;
const OVERDUE_CHECK_INTERVAL_MS = 5 * 60_000; // 5 minutes
const REMINDER_CHECK_INTERVAL_MS = 60_000; // 1 minute
const CONTENT_DELIVERY_INTERVAL_MS = 30 * 60_000; // 30 minutes
const INSTAGRAM_REENGAGEMENT_INTERVAL_MS = 15 * 60_000; // 15 minutes
const INSTAGRAM_WINDOW_HOURS = 24;
const INACTIVITY_CHECK_INTERVAL_MS = 6 * 60 * 60_000; // 6 hours
const INACTIVITY_THRESHOLD_HOURS = 48;
const HARD_DELETE_CHECK_INTERVAL_MS = 24 * 60 * 60_000; // 24 hours
const SESSION_CLEANUP_INTERVAL_MS = 24 * 60 * 60_000; // 24 hours
const EMAIL_VERIFICATION_DEADLINE_MS = 6 * 60 * 60_000; // Check every 6 hours
const EMAIL_VERIFICATION_DEADLINE_HOURS = 48;

// ── Active interval handles (for graceful shutdown) ─────────────────

const activeIntervals: NodeJS.Timeout[] = [];
let isRunning = false;

// ── Parse fallback chain from DB (stored as JSON string) ────────────

function parseFallbackChain(raw: string | null): readonly string[] | null {
  if (!raw) return null;
  try {
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : null;
  } catch {
    return null;
  }
}

// ── Build UserPrefs from DB row ─────────────────────────────────────

function toUserPrefs(
  row: {
    readonly primaryChannel: string;
    readonly fallbackChain: string | null;
    readonly quietStart: string | null;
    readonly quietEnd: string | null;
    readonly timezone: string;
    readonly maxRemindersPerDay: number;
    readonly digestMode: string;
    readonly advanceReminderMinutes: number;
  },
): UserPrefs {
  return {
    primaryChannel: row.primaryChannel,
    fallbackChain: parseFallbackChain(row.fallbackChain),
    escalationDelays: {},
    advanceReminderMinutes: row.advanceReminderMinutes,
    quietStart: row.quietStart,
    quietEnd: row.quietEnd,
    timezone: row.timezone,
    overrideForUrgent: true,
    digestMode: row.digestMode,
  };
}

// ── Job: Check Reminders Due ────────────────────────────────────────
// Runs every 1 minute. Finds tasks with due dates in the next window
// and dispatches reminder cascades for each.

export async function checkReminders(): Promise<number> {
  const now = new Date();
  const windowEnd = new Date(now.getTime() + REMINDER_WINDOW_MINUTES * 60_000);

  try {
    // Find tasks with due dates in the upcoming window that are still active
    const dueTasks = await db
      .select({
        task: tasks,
        prefs: notificationPreferences,
      })
      .from(tasks)
      .leftJoin(
        notificationPreferences,
        eq(tasks.userId, notificationPreferences.userId),
      )
      .where(
        and(
          isNotNull(tasks.dueDate),
          gte(tasks.dueDate, now),
          lte(tasks.dueDate, windowEnd),
          ne(tasks.status, "completed"),
          ne(tasks.status, "cancelled"),
        ),
      );

    if (dueTasks.length === 0) {
      return 0;
    }

    let totalDispatched = 0;

    for (const { task, prefs } of dueTasks) {
      const userPrefs = prefs ? toUserPrefs(prefs) : undefined;

      const jobs = planReminders(
        {
          taskId: task.id,
          userId: task.userId,
          title: task.title,
          dueDate: task.dueDate,
          priority: task.priority,
          status: task.status,
        },
        userPrefs,
      );

      if (jobs && jobs.length > 0) {
        // Enrich each job with the recipient identifier from the user's channels
        const enrichedJobs = await enrichJobsWithRecipients(task.userId, jobs);
        const result = await dispatchBatch(enrichedJobs, userPrefs);
        totalDispatched += result.dispatched;
      }
    }

    log.info(
      { tasksChecked: dueTasks.length, dispatched: totalDispatched },
      "Reminder check complete",
    );

    return totalDispatched;
  } catch (error) {
    log.error(
      { error: error instanceof Error ? error.message : "Unknown error" },
      "Reminder check failed",
    );
    return 0;
  }
}

// ── Job: Detect Overdue Tasks ───────────────────────────────────────
// Runs every 5 minutes. Finds overdue tasks and dispatches alerts
// with escalating severity.

export async function checkOverdue(): Promise<number> {
  const now = new Date();

  try {
    const overdueTasks = await db
      .select({
        task: tasks,
        prefs: notificationPreferences,
      })
      .from(tasks)
      .leftJoin(
        notificationPreferences,
        eq(tasks.userId, notificationPreferences.userId),
      )
      .where(
        and(
          isNotNull(tasks.dueDate),
          lte(tasks.dueDate, now),
          ne(tasks.status, "completed"),
          ne(tasks.status, "cancelled"),
        ),
      );

    if (overdueTasks.length === 0) {
      return 0;
    }

    // Group by user for batch processing
    const userTaskMap = new Map<
      string,
      {
        tasks: Array<{
          readonly id: string;
          readonly userId: string;
          readonly title: string;
          readonly dueDate: Date | null;
          readonly priority: string;
          readonly status: string;
        }>;
        prefs?: UserPrefs;
      }
    >();

    for (const { task, prefs } of overdueTasks) {
      const existing = userTaskMap.get(task.userId);
      const taskData = {
        id: task.id,
        userId: task.userId,
        title: task.title,
        dueDate: task.dueDate,
        priority: task.priority,
        status: task.status,
      };

      if (existing) {
        existing.tasks.push(taskData);
      } else {
        userTaskMap.set(task.userId, {
          tasks: [taskData],
          prefs: prefs ? toUserPrefs(prefs) : undefined,
        });
      }
    }

    let totalDispatched = 0;

    for (const [userId, { tasks: userTasks, prefs }] of userTaskMap) {
      const jobs = planOverdueAlerts(userTasks, now);

      if (jobs.length > 0) {
        const enrichedJobs = await enrichJobsWithRecipients(userId, jobs);
        const result = await dispatchBatch(enrichedJobs, prefs);
        totalDispatched += result.dispatched;
      }
    }

    log.info(
      { usersChecked: userTaskMap.size, dispatched: totalDispatched },
      "Overdue check complete",
    );

    return totalDispatched;
  } catch (error) {
    log.error(
      { error: error instanceof Error ? error.message : "Unknown error" },
      "Overdue check failed",
    );
    return 0;
  }
}

// ── Job: Send Daily Digest ──────────────────────────────────────────
// Runs once per day. For each user with digest enabled, builds a
// summary and dispatches it to their primary channel.

export async function sendDailyDigest(): Promise<number> {
  const now = new Date();
  const startOfDay = new Date(now.toISOString().split("T")[0] + "T00:00:00Z");
  const endOfDay = new Date(now.toISOString().split("T")[0] + "T23:59:59.999Z");

  try {
    // Find all users with digest mode enabled
    const usersWithDigest = await db
      .select({
        prefs: notificationPreferences,
        profile: profiles,
      })
      .from(notificationPreferences)
      .innerJoin(profiles, eq(notificationPreferences.userId, profiles.id))
      .where(ne(notificationPreferences.digestMode, "off"));

    if (usersWithDigest.length === 0) {
      return 0;
    }

    let totalDispatched = 0;

    for (const { prefs, profile } of usersWithDigest) {
      // Fetch user's tasks
      const userTasks = await db
        .select()
        .from(tasks)
        .where(eq(tasks.userId, prefs.userId));

      const userPrefs = toUserPrefs(prefs);
      const userName = profile.name ?? "there";

      // For streak calculation: count consecutive days with at least one completed task
      // Simplified: just use 0 for now, a proper streak service would handle this
      const streakDays = 0;

      const job = planDigest(
        prefs.userId,
        userName,
        userTasks.map((t) => ({
          id: t.id,
          title: t.title,
          dueDate: t.dueDate,
          priority: t.priority,
          status: t.status,
          completedAt: t.completedAt,
        })),
        { digestMode: userPrefs.digestMode, primaryChannel: userPrefs.primaryChannel },
        streakDays,
        now,
      );

      if (job) {
        const enrichedJobs = await enrichJobsWithRecipients(prefs.userId, [job]);
        const result = await dispatchBatch(enrichedJobs, userPrefs);
        totalDispatched += result.dispatched;
      }
    }

    log.info(
      { usersProcessed: usersWithDigest.length, dispatched: totalDispatched },
      "Daily digest complete",
    );

    return totalDispatched;
  } catch (error) {
    log.error(
      { error: error instanceof Error ? error.message : "Unknown error" },
      "Daily digest failed",
    );
    return 0;
  }
}

// ── Job: Instagram Re-Engagement ────────────────────────────────────
// Runs every 15 minutes. Checks for Instagram channels where the 24h
// messaging window is about to expire. Sends a re-engagement push
// notification prompting the user to interact so the window resets.

export async function checkInstagramWindows(): Promise<number> {
  try {
    const windowCutoff = new Date(
      Date.now() - INSTAGRAM_WINDOW_HOURS * 60 * 60 * 1000,
    );

    // Find Instagram channels where the last interaction was > 24h ago
    // (updatedAt tracks the last user interaction / message sent)
    const expiringChannels = await db
      .select()
      .from(notificationChannels)
      .where(
        and(
          eq(notificationChannels.channelType, "instagram"),
          eq(notificationChannels.isEnabled, true),
          eq(notificationChannels.isVerified, true),
          lte(notificationChannels.updatedAt, windowCutoff),
        ),
      );

    if (expiringChannels.length === 0) {
      return 0;
    }

    let dispatched = 0;

    for (const channel of expiringChannels) {
      // Send a push notification to the user about the expiring Instagram window
      const jobs = [
        {
          userId: channel.userId,
          notificationId: crypto.randomUUID(),
          channel: "push" as const,
          messageType: "system",
          templateVars: {
            _recipient: "",
            task_title: "Your Instagram notification window is expiring",
          },
          priority: 8,
          attemptNumber: 1,
        },
      ];

      const enrichedJobs = await enrichJobsWithRecipients(channel.userId, jobs);
      const result = await dispatchBatch(enrichedJobs);
      dispatched += result.dispatched;
    }

    log.info(
      { expiring: expiringChannels.length, dispatched },
      "Instagram window check complete",
    );

    return dispatched;
  } catch (error) {
    log.error(
      { error: error instanceof Error ? error.message : "Unknown error" },
      "Instagram window check failed",
    );
    return 0;
  }
}

// ── Job: Gentle Re-Engagement ──────────────────────────────────────
// Retention Hook #6. Runs every 6 hours. Finds users with no task
// activity (no task created, completed, or updated) in the last 48h.
// Sends a gentle push notification: "Your tasks are waiting for you."
// Respects quiet hours and notification preferences.

export async function checkInactiveUsers(): Promise<number> {
  const cutoff = new Date(
    Date.now() - INACTIVITY_THRESHOLD_HOURS * 60 * 60 * 1000,
  );

  try {
    // Find users who have tasks but none updated/completed since cutoff.
    // We check profiles that have at least one task but whose most recent
    // task updatedAt is older than the threshold.
    const allProfiles = await db.select().from(profiles);

    let dispatched = 0;

    for (const profile of allProfiles) {
      // Find the most recently updated task for this user.
      const userTasks = await db
        .select()
        .from(tasks)
        .where(eq(tasks.userId, profile.id));

      if (userTasks.length === 0) continue;

      // Check if any task was updated within the threshold.
      const hasRecentActivity = userTasks.some((t) => {
        const updatedAt = t.updatedAt ?? t.createdAt;
        return updatedAt != null && updatedAt > cutoff;
      });

      if (hasRecentActivity) continue;

      // Check if the user has notification preferences (respect opt-out).
      const [prefs] = await db
        .select()
        .from(notificationPreferences)
        .where(eq(notificationPreferences.userId, profile.id));

      if (!prefs) continue;

      // Build a gentle push notification.
      const job = {
        userId: profile.id,
        notificationId: crypto.randomUUID(),
        channel: "push" as const,
        messageType: "re_engagement" as const,
        templateVars: {
          _recipient: "",
          task_title: `Hey ${profile.name ?? "there"}, your tasks miss you! Pick up where you left off.`,
        },
        priority: 3, // Low priority — gentle nudge.
        attemptNumber: 1,
      };

      const enrichedJobs = await enrichJobsWithRecipients(profile.id, [job]);
      const result = await dispatchBatch(enrichedJobs, toUserPrefs(prefs));
      dispatched += result.dispatched;
    }

    log.info(
      { dispatched },
      "Inactivity re-engagement check complete",
    );

    return dispatched;
  } catch (error) {
    log.error(
      { error: error instanceof Error ? error.message : "Unknown error" },
      "Inactivity re-engagement check failed",
    );
    return 0;
  }
}

// ── Enrich Jobs with Recipient Identifiers ──────────────────────────
// Looks up the user's connected channel identifiers and injects them
// into the job's templateVars._recipient field.

async function enrichJobsWithRecipients(
  userId: string,
  jobs: readonly import("../../queue/types.js").NotificationJobData[],
): Promise<import("../../queue/types.js").NotificationJobData[]> {
  // Fetch all connected channels for this user
  const channels = await db
    .select()
    .from(notificationChannels)
    .where(
      and(
        eq(notificationChannels.userId, userId),
        eq(notificationChannels.isEnabled, true),
      ),
    );

  const channelMap = new Map<string, string>(
    channels.map((ch) => [ch.channelType, ch.channelIdentifier]),
  );

  return jobs.map((job) => {
    const recipient = channelMap.get(job.channel) ?? "";
    return {
      ...job,
      templateVars: {
        ...job.templateVars,
        _recipient: recipient,
      },
    };
  });
}

// ── Email Verification 48h Deadline ──────────────────────────────────

/**
 * Enforces the 48-hour email verification deadline.
 * Users who registered more than 48 hours ago without verifying their email
 * are transitioned to "pending_verification" status, which gates premium features.
 */
async function enforceEmailVerificationDeadline(): Promise<number> {
  const cutoff = new Date(
    Date.now() - EMAIL_VERIFICATION_DEADLINE_HOURS * 60 * 60 * 1000,
  );

  try {
    // Find users past the 48h deadline with unverified email and still "active"
    const unverified = await db
      .select({ id: profiles.id })
      .from(profiles)
      .where(
        and(
          eq(profiles.emailVerified, false),
          eq(profiles.accountStatus, "active"),
          lte(profiles.createdAt, cutoff),
        ),
      );

    if (unverified.length === 0) return 0;

    // Transition them to pending_verification
    for (const user of unverified) {
      await db
        .update(profiles)
        .set({
          accountStatus: "pending_verification",
          updatedAt: new Date(),
        })
        .where(eq(profiles.id, user.id));
    }

    log.info(
      { count: unverified.length },
      "Enforced 48h email verification deadline",
    );
    return unverified.length;
  } catch (error) {
    log.error({ error }, "Email verification deadline enforcement failed");
    return 0;
  }
}

// ── Scheduler Lifecycle ─────────────────────────────────────────────

/**
 * Starts all periodic cron jobs using setInterval.
 * In production with BullMQ, these would be repeatable jobs on a queue.
 * This in-memory approach works for dev and single-instance deployments.
 */
export function startCronJobs(): void {
  if (isRunning) {
    log.warn("Cron scheduler already running");
    return;
  }

  isRunning = true;
  log.info("Starting cron scheduler");

  // Every 1 minute: check for tasks with reminders due
  const reminderInterval = setInterval(() => {
    checkReminders().catch((error) => {
      log.error({ error }, "Unhandled error in reminder check");
    });
  }, REMINDER_CHECK_INTERVAL_MS);
  activeIntervals.push(reminderInterval);

  // Every 5 minutes: run overdue detector
  const overdueInterval = setInterval(() => {
    checkOverdue().catch((error) => {
      log.error({ error }, "Unhandled error in overdue check");
    });
  }, OVERDUE_CHECK_INTERVAL_MS);
  activeIntervals.push(overdueInterval);

  // Every day at midnight UTC: send daily digest
  // In dev mode, check every 60 minutes whether it's time for digest
  const DIGEST_CHECK_INTERVAL_MS = 60 * 60_000; // 1 hour
  const digestInterval = setInterval(() => {
    const hour = new Date().getUTCHours();
    // Send digest at 6 AM UTC (adjustable per user timezone in production)
    if (hour === 6) {
      sendDailyDigest().catch((error) => {
        log.error({ error }, "Unhandled error in daily digest");
      });
    }
  }, DIGEST_CHECK_INTERVAL_MS);
  activeIntervals.push(digestInterval);

  // Every 30 minutes: run daily content delivery cycle
  // Content scheduler checks per-user delivery time windows internally,
  // so running frequently ensures content arrives within each user's window.
  const contentInterval = setInterval(() => {
    runContentDelivery().catch((error) => {
      log.error({ error }, "Unhandled error in content delivery");
    });
  }, CONTENT_DELIVERY_INTERVAL_MS);
  activeIntervals.push(contentInterval);

  // Every 15 minutes: check Instagram 24h windows
  const instagramInterval = setInterval(() => {
    checkInstagramWindows().catch((error) => {
      log.error({ error }, "Unhandled error in Instagram window check");
    });
  }, INSTAGRAM_REENGAGEMENT_INTERVAL_MS);
  activeIntervals.push(instagramInterval);

  // Every 6 hours: gentle re-engagement for inactive users (48h threshold)
  const inactivityInterval = setInterval(() => {
    checkInactiveUsers().catch((error) => {
      log.error({ error }, "Unhandled error in inactivity check");
    });
  }, INACTIVITY_CHECK_INTERVAL_MS);
  activeIntervals.push(inactivityInterval);

  // Every 15 minutes: sync external calendar changes (Google, Apple, Outlook)
  const calendarSyncInterval = setInterval(() => {
    runCalendarSync().catch((error) => {
      log.error({ error }, "Unhandled error in calendar sync");
    });
  }, CALENDAR_SYNC_INTERVAL_MS);
  activeIntervals.push(calendarSyncInterval);

  // Every 24 hours: hard-delete accounts past 90-day recovery period (GDPR Art.17)
  const hardDeleteInterval = setInterval(() => {
    hardDeleteExpiredAccounts()
      .then((result) => {
        if (result.deletedCount > 0 || result.failedIds.length > 0) {
          log.info(
            { deleted: result.deletedCount, failed: result.failedIds.length },
            "GDPR hard-delete sweep complete",
          );
        }
      })
      .catch((error) => {
        log.error({ error }, "Unhandled error in GDPR hard-delete sweep");
      });
  }, HARD_DELETE_CHECK_INTERVAL_MS);
  activeIntervals.push(hardDeleteInterval);

  // Every 24 hours: clean up expired user sessions
  const sessionCleanupInterval = setInterval(() => {
    cleanupExpiredSessions()
      .then((count) => {
        if (count > 0) {
          log.info({ deletedCount: count }, "Expired session cleanup complete");
        }
      })
      .catch((error) => {
        log.error({ error }, "Unhandled error in session cleanup");
      });
  }, SESSION_CLEANUP_INTERVAL_MS);
  activeIntervals.push(sessionCleanupInterval);

  // Every 6 hours: enforce 48h email verification deadline
  const emailVerificationInterval = setInterval(() => {
    enforceEmailVerificationDeadline().catch((error) => {
      log.error({ error }, "Unhandled error in email verification deadline check");
    });
  }, EMAIL_VERIFICATION_DEADLINE_MS);
  activeIntervals.push(emailVerificationInterval);

  log.info(
    {
      reminderIntervalMs: REMINDER_CHECK_INTERVAL_MS,
      overdueIntervalMs: OVERDUE_CHECK_INTERVAL_MS,
      digestCheckIntervalMs: DIGEST_CHECK_INTERVAL_MS,
      contentDeliveryIntervalMs: CONTENT_DELIVERY_INTERVAL_MS,
      instagramIntervalMs: INSTAGRAM_REENGAGEMENT_INTERVAL_MS,
      inactivityIntervalMs: INACTIVITY_CHECK_INTERVAL_MS,
      calendarSyncIntervalMs: CALENDAR_SYNC_INTERVAL_MS,
      hardDeleteIntervalMs: HARD_DELETE_CHECK_INTERVAL_MS,
      sessionCleanupIntervalMs: SESSION_CLEANUP_INTERVAL_MS,
      emailVerificationDeadlineMs: EMAIL_VERIFICATION_DEADLINE_MS,
    },
    "All cron jobs started",
  );
}

/**
 * Stops all periodic cron jobs and clears interval handles.
 */
export function stopCronJobs(): void {
  if (!isRunning) {
    return;
  }

  for (const interval of activeIntervals) {
    clearInterval(interval);
  }
  activeIntervals.length = 0;
  isRunning = false;

  log.info("Cron scheduler stopped");
}

/**
 * Returns whether the cron scheduler is currently running.
 */
export function isCronRunning(): boolean {
  return isRunning;
}
