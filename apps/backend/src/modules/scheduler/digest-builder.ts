// ── Digest Builder ──────────────────────────────────────────────────
// Aggregates task data into a digest payload for daily/weekly summaries.

import type { DigestEntry, DigestPayload } from "./scheduler.types.js";

/**
 * Builds a digest payload from raw task data.
 * Pure function — no side effects, no DB calls.
 */
export function buildDigest(
  userId: string,
  tasks: ReadonlyArray<{
    readonly id: string;
    readonly title: string;
    readonly dueDate: Date | null;
    readonly priority: string;
    readonly status: string;
    readonly completedAt: Date | null;
  }>,
  streakDays: number,
  date: Date = new Date(),
): DigestPayload {
  const dateStr = date.toISOString().split("T")[0];
  const startOfDay = new Date(dateStr + "T00:00:00Z");
  const endOfDay = new Date(dateStr + "T23:59:59.999Z");

  const entries: DigestEntry[] = tasks.map((t) => ({
    taskId: t.id,
    title: t.title,
    dueDate: t.dueDate,
    priority: t.priority,
    status: t.status,
  }));

  const pendingTasks = entries.filter(
    (e) => e.status === "pending" || e.status === "in_progress",
  );

  const overdueTasks = entries.filter(
    (e) =>
      e.dueDate !== null &&
      e.dueDate < date &&
      e.status !== "completed" &&
      e.status !== "cancelled",
  );

  const completedToday = tasks.filter(
    (t) =>
      t.completedAt !== null &&
      t.completedAt >= startOfDay &&
      t.completedAt <= endOfDay,
  ).length;

  return {
    userId,
    date: dateStr,
    pendingTasks,
    overdueTasks,
    completedToday,
    streakDays,
  };
}

/**
 * Formats a digest payload into template variables for rendering.
 */
export function digestToTemplateVars(
  digest: DigestPayload,
  userName: string,
): Readonly<Record<string, string>> {
  const pendingCount = digest.pendingTasks.length;
  const overdueCount = digest.overdueTasks.length;

  const topPending = digest.pendingTasks
    .slice(0, 3)
    .map((t) => `- ${t.title}`)
    .join("\n");

  return {
    user_name: userName,
    date: digest.date,
    pending_count: String(pendingCount),
    overdue_count: String(overdueCount),
    completed_today: String(digest.completedToday),
    streak_count: String(digest.streakDays),
    top_tasks: topPending || "No pending tasks",
  };
}

/**
 * Determines whether a digest should be sent based on user preferences.
 */
export function shouldSendDigest(
  digestMode: string,
  dayOfWeek: number, // 0=Sunday, 6=Saturday
): boolean {
  switch (digestMode) {
    case "daily":
      return true;
    case "weekdays":
      return dayOfWeek >= 1 && dayOfWeek <= 5;
    case "weekly":
      return dayOfWeek === 1; // Monday
    case "off":
      return false;
    default:
      return false;
  }
}

/**
 * Determines the message type for digest notifications.
 */
export function digestMessageType(): string {
  return "daily_digest";
}
