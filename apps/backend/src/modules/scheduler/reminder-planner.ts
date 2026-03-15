// ── Reminder Planner ────────────────────────────────────────────────
// Given a task and user preferences, computes the full cascade of
// notifications to schedule: one per channel, staggered by the
// configured escalation delays.

import type { ReminderPlan, ScheduledReminder } from "./scheduler.types.js";

const DEFAULT_ADVANCE_MINUTES = 15;
const DEFAULT_ESCALATION_DELAY = 5; // minutes between cascade steps
const MAX_CASCADE_STEPS = 8;

/**
 * Maps task priority string to numeric priority (1 = highest).
 * Higher priority tasks get shorter escalation delays.
 */
export function priorityToNumber(priority: string): number {
  switch (priority) {
    case "urgent":
      return 1;
    case "high":
      return 2;
    case "medium":
      return 5;
    case "low":
      return 7;
    default:
      return 5;
  }
}

/**
 * Computes the first reminder time: dueDate minus advanceMinutes.
 */
export function computeFirstReminderTime(
  dueDate: Date,
  advanceMinutes: number,
): Date {
  return new Date(dueDate.getTime() - advanceMinutes * 60 * 1000);
}

/**
 * Given a plan, produces an ordered list of ScheduledReminder objects
 * representing the full cascade for a single task.
 *
 * Each step uses the next channel in the fallback chain, delayed by
 * the configured escalation delay for that channel.
 */
export function buildCascade(plan: ReminderPlan): readonly ScheduledReminder[] {
  const cascadeId = crypto.randomUUID();
  const firstTime = computeFirstReminderTime(
    plan.dueDate,
    plan.advanceMinutes || DEFAULT_ADVANCE_MINUTES,
  );

  const channels = plan.channels.slice(0, MAX_CASCADE_STEPS);
  let cumulativeDelayMs = 0;

  return channels.map((channel, index) => {
    if (index > 0) {
      const delayMinutes =
        plan.escalationDelays[channels[index - 1]] ??
        DEFAULT_ESCALATION_DELAY;
      cumulativeDelayMs += delayMinutes * 60 * 1000;
    }

    const scheduledAt = new Date(firstTime.getTime() + cumulativeDelayMs);

    return {
      id: crypto.randomUUID(),
      taskId: plan.taskId,
      userId: plan.userId,
      channel,
      scheduledAt,
      cascadeId,
      cascadeOrder: index,
      status: "pending" as const,
    };
  });
}

/**
 * Determines whether a task should trigger a reminder based on its
 * status and due date. Returns false for completed/cancelled tasks
 * or tasks without a due date.
 */
export function shouldScheduleReminder(
  status: string,
  dueDate: Date | null,
): boolean {
  if (!dueDate) return false;
  if (status === "completed" || status === "cancelled") return false;
  // Don't schedule reminders for tasks already past due + 24h
  const cutoff = new Date(Date.now() - 24 * 60 * 60 * 1000);
  if (dueDate < cutoff) return false;
  return true;
}

/**
 * Returns default fallback chain based on priority level.
 * Urgent tasks get more channels in their cascade.
 */
export function defaultFallbackChain(priority: string): readonly string[] {
  switch (priority) {
    case "urgent":
      return ["push", "telegram", "whatsapp", "sms", "email"];
    case "high":
      return ["push", "telegram", "email", "whatsapp"];
    case "medium":
      return ["push", "telegram", "email"];
    case "low":
      return ["push", "email"];
    default:
      return ["push", "telegram", "email"];
  }
}
