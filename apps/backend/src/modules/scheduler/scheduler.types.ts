// ── Scheduler Types ──────────────────────────────────────────────────
// Shared types for the task-notification bridge.

export interface ReminderPlan {
  readonly taskId: string;
  readonly userId: string;
  readonly taskTitle: string;
  readonly dueDate: Date;
  readonly priority: number;
  readonly advanceMinutes: number;
  readonly channels: readonly string[];
  readonly escalationDelays: Readonly<Record<string, number>>;
}

export interface ScheduledReminder {
  readonly id: string;
  readonly taskId: string;
  readonly userId: string;
  readonly channel: string;
  readonly scheduledAt: Date;
  readonly cascadeId: string;
  readonly cascadeOrder: number;
  readonly status: "pending" | "queued" | "sent" | "cancelled";
}

export interface OverdueTask {
  readonly taskId: string;
  readonly userId: string;
  readonly title: string;
  readonly dueDate: Date;
  readonly minutesOverdue: number;
  readonly priority: string;
}

export interface DigestEntry {
  readonly taskId: string;
  readonly title: string;
  readonly dueDate: Date | null;
  readonly priority: string;
  readonly status: string;
}

export interface DigestPayload {
  readonly userId: string;
  readonly date: string;
  readonly pendingTasks: readonly DigestEntry[];
  readonly overdueTasks: readonly DigestEntry[];
  readonly completedToday: number;
  readonly streakDays: number;
}

export type SchedulerEventType =
  | "reminder:schedule"
  | "reminder:cancel"
  | "reminder:escalate"
  | "overdue:detected"
  | "digest:generate";
