// ── Overdue Detector ────────────────────────────────────────────────
// Pure functions that detect overdue tasks and determine alert levels.

import type { OverdueTask } from "./scheduler.types.js";

export type AlertLevel = "mild" | "moderate" | "severe" | "critical";

/**
 * Computes how many minutes a task is overdue.
 * Returns 0 if the task is not yet due.
 */
export function computeMinutesOverdue(
  dueDate: Date,
  now: Date = new Date(),
): number {
  const diff = now.getTime() - dueDate.getTime();
  return Math.max(0, Math.floor(diff / (60 * 1000)));
}

/**
 * Determines the alert level based on how long a task has been overdue
 * and its priority.
 */
export function determineAlertLevel(
  minutesOverdue: number,
  priority: string,
): AlertLevel {
  const urgencyMultiplier = priority === "urgent" ? 0.5 : priority === "high" ? 0.75 : 1;
  const adjustedMinutes = minutesOverdue * (1 / urgencyMultiplier);

  if (adjustedMinutes >= 1440) return "critical"; // 24h+
  if (adjustedMinutes >= 360) return "severe"; // 6h+
  if (adjustedMinutes >= 60) return "moderate"; // 1h+
  return "mild";
}

/**
 * Selects which channels to use for an overdue alert based on the
 * alert level. More severe = more channels.
 */
export function channelsForAlertLevel(level: AlertLevel): readonly string[] {
  switch (level) {
    case "mild":
      return ["push"];
    case "moderate":
      return ["push", "telegram"];
    case "severe":
      return ["push", "telegram", "email", "whatsapp"];
    case "critical":
      return ["push", "telegram", "email", "whatsapp", "sms"];
  }
}

/**
 * Determines the message type template to use for overdue notifications.
 */
export function overdueMessageType(level: AlertLevel): string {
  return "overdue_alert";
}

/**
 * Filters a list of tasks to find those that are overdue,
 * returning enriched OverdueTask objects.
 */
export function findOverdueTasks(
  tasks: ReadonlyArray<{
    readonly id: string;
    readonly userId: string;
    readonly title: string;
    readonly dueDate: Date | null;
    readonly priority: string;
    readonly status: string;
  }>,
  now: Date = new Date(),
): readonly OverdueTask[] {
  return tasks
    .filter((t) => {
      if (!t.dueDate) return false;
      if (t.status === "completed" || t.status === "cancelled") return false;
      return t.dueDate < now;
    })
    .map((t) => ({
      taskId: t.id,
      userId: t.userId,
      title: t.title,
      dueDate: t.dueDate!,
      minutesOverdue: computeMinutesOverdue(t.dueDate!, now),
      priority: t.priority,
    }));
}

/**
 * Groups overdue tasks by userId for batch processing.
 */
export function groupByUser(
  tasks: readonly OverdueTask[],
): ReadonlyMap<string, readonly OverdueTask[]> {
  const groups = new Map<string, OverdueTask[]>();

  for (const task of tasks) {
    const existing = groups.get(task.userId);
    if (existing) {
      existing.push(task);
    } else {
      groups.set(task.userId, [task]);
    }
  }

  return groups;
}
