// ── Scheduler Service ───────────────────────────────────────────────
// Orchestrates the task → notification bridge. Provides high-level
// functions that combine planner, overdue detector, digest builder,
// and quiet hours into cohesive workflows.

import type { ReminderPlan, DigestPayload } from "./scheduler.types.js";
import type { NotificationJobData } from "../../queue/types.js";
import { CHANNEL_QUEUES } from "../../queue/types.js";
import {
  buildCascade,
  shouldScheduleReminder,
  defaultFallbackChain,
  priorityToNumber,
} from "./reminder-planner.js";
import {
  findOverdueTasks,
  determineAlertLevel,
  channelsForAlertLevel,
  computeMinutesOverdue,
} from "./overdue-detector.js";
import {
  buildDigest,
  digestToTemplateVars,
  shouldSendDigest,
} from "./digest-builder.js";
import { isQuietHoursActive } from "./quiet-hours.js";

// ── Port: Queue Enqueue ─────────────────────────────────────────────
// Injected dependency so the scheduler stays testable without BullMQ.

export interface QueuePort {
  enqueue(
    queue: string,
    jobName: string,
    data: NotificationJobData,
    delayMs?: number,
  ): void;
}

// ── Port: Notification Repository ───────────────────────────────────
export interface SchedulerNotificationPort {
  insertNotification(data: {
    userId: string;
    taskId?: string;
    type: string;
    title: string;
    body: string;
    scheduledAt: Date;
    priority: number;
    cascadeId?: string;
    cascadeOrder?: number;
  }): Promise<{ id: string }>;
}

// ── Schedule Reminders for a Task ───────────────────────────────────

export interface ScheduleReminderInput {
  readonly taskId: string;
  readonly userId: string;
  readonly title: string;
  readonly dueDate: Date | null;
  readonly priority: string;
  readonly status: string;
}

export interface UserPrefs {
  readonly primaryChannel: string;
  readonly fallbackChain: readonly string[] | null;
  readonly escalationDelays: Readonly<Record<string, number>>;
  readonly advanceReminderMinutes: number;
  readonly quietStart: string | null;
  readonly quietEnd: string | null;
  readonly timezone: string;
  readonly overrideForUrgent: boolean;
  readonly digestMode: string;
}

const DEFAULT_PREFS: UserPrefs = {
  primaryChannel: "push",
  fallbackChain: null,
  escalationDelays: {},
  advanceReminderMinutes: 15,
  quietStart: null,
  quietEnd: null,
  timezone: "UTC",
  overrideForUrgent: true,
  digestMode: "off",
};

/**
 * Schedules the full cascade of reminders for a single task.
 * Returns the cascade ID or null if no reminders were scheduled.
 */
export function planReminders(
  task: ScheduleReminderInput,
  prefs: UserPrefs = DEFAULT_PREFS,
): readonly NotificationJobData[] | null {
  if (!shouldScheduleReminder(task.status, task.dueDate)) {
    return null;
  }

  const channels =
    prefs.fallbackChain && prefs.fallbackChain.length > 0
      ? prefs.fallbackChain
      : defaultFallbackChain(task.priority);

  const plan: ReminderPlan = {
    taskId: task.taskId,
    userId: task.userId,
    taskTitle: task.title,
    dueDate: task.dueDate!,
    priority: priorityToNumber(task.priority),
    advanceMinutes: prefs.advanceReminderMinutes,
    channels,
    escalationDelays: prefs.escalationDelays,
  };

  const cascade = buildCascade(plan);

  return cascade.map((reminder) => ({
    userId: task.userId,
    taskId: task.taskId,
    notificationId: reminder.id,
    channel: reminder.channel,
    messageType: "task_reminder",
    templateVars: {
      task_title: task.title,
      due_time: formatDueTime(task.dueDate!),
    },
    priority: plan.priority,
    cascadeId: reminder.cascadeId,
    attemptNumber: 1,
  }));
}

/**
 * Processes overdue tasks and returns notification jobs for each.
 */
export function planOverdueAlerts(
  tasks: ReadonlyArray<{
    readonly id: string;
    readonly userId: string;
    readonly title: string;
    readonly dueDate: Date | null;
    readonly priority: string;
    readonly status: string;
  }>,
  now: Date = new Date(),
): readonly NotificationJobData[] {
  const overdue = findOverdueTasks(tasks, now);
  const jobs: NotificationJobData[] = [];

  for (const task of overdue) {
    const level = determineAlertLevel(task.minutesOverdue, task.priority);
    const channels = channelsForAlertLevel(level);

    for (const channel of channels) {
      jobs.push({
        userId: task.userId,
        taskId: task.taskId,
        notificationId: crypto.randomUUID(),
        channel,
        messageType: "overdue_alert",
        templateVars: {
          task_title: task.title,
        },
        priority: level === "critical" ? 1 : level === "severe" ? 2 : 5,
        attemptNumber: 1,
      });
    }
  }

  return jobs;
}

/**
 * Builds a digest notification job for a user.
 */
export function planDigest(
  userId: string,
  userName: string,
  tasks: ReadonlyArray<{
    readonly id: string;
    readonly title: string;
    readonly dueDate: Date | null;
    readonly priority: string;
    readonly status: string;
    readonly completedAt: Date | null;
  }>,
  prefs: Pick<UserPrefs, "digestMode" | "primaryChannel">,
  streakDays: number,
  date: Date = new Date(),
): NotificationJobData | null {
  if (!shouldSendDigest(prefs.digestMode, date.getDay())) {
    return null;
  }

  const digest = buildDigest(userId, tasks, streakDays, date);

  if (digest.pendingTasks.length === 0 && digest.overdueTasks.length === 0) {
    return null; // Nothing to report
  }

  const vars = digestToTemplateVars(digest, userName);

  return {
    userId,
    notificationId: crypto.randomUUID(),
    channel: prefs.primaryChannel,
    messageType: "daily_digest",
    templateVars: vars,
    priority: 7,
    attemptNumber: 1,
  };
}

// ── Helpers ─────────────────────────────────────────────────────────

function formatDueTime(dueDate: Date): string {
  const now = new Date();
  const diffMs = dueDate.getTime() - now.getTime();
  const diffMin = Math.round(diffMs / (60 * 1000));

  if (diffMin < 0) {
    const overdue = Math.abs(diffMin);
    if (overdue < 60) return `${overdue} min ago`;
    if (overdue < 1440) return `${Math.round(overdue / 60)}h ago`;
    return `${Math.round(overdue / 1440)}d ago`;
  }

  if (diffMin < 60) return `in ${diffMin} min`;
  if (diffMin < 1440) return `in ${Math.round(diffMin / 60)}h`;
  return `in ${Math.round(diffMin / 1440)}d`;
}
