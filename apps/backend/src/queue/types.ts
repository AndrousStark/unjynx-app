// ── Job Data ──────────────────────────────────────────────────────────

export interface NotificationJobData {
  readonly userId: string;
  readonly taskId?: string;
  readonly notificationId: string;
  readonly channel: string;
  readonly messageType: string;
  readonly templateVars: Record<string, string>;
  readonly priority: number;
  readonly cascadeId?: string;
  readonly attemptNumber: number;
}

// ── Worker Result ─────────────────────────────────────────────────────

export interface ChannelWorkerResult {
  readonly success: boolean;
  readonly providerMessageId?: string;
  readonly errorType?: string;
  readonly errorMessage?: string;
  readonly costAmount?: string;
  readonly costCurrency?: string;
}

// ── Quota Check ───────────────────────────────────────────────────────

export interface QuotaCheckResult {
  readonly allowed: boolean;
  readonly remaining: number;
  readonly resetAt: Date;
}

// ── Queue Names ───────────────────────────────────────────────────────

export type ChannelQueueName =
  | "notification:push"
  | "notification:telegram"
  | "notification:email"
  | "notification:whatsapp"
  | "notification:sms"
  | "notification:instagram"
  | "notification:slack"
  | "notification:discord"
  | "notification:digest"
  | "notification:escalation";

export const CHANNEL_QUEUES: Readonly<Record<string, ChannelQueueName>> = {
  push: "notification:push",
  telegram: "notification:telegram",
  email: "notification:email",
  whatsapp: "notification:whatsapp",
  sms: "notification:sms",
  instagram: "notification:instagram",
  slack: "notification:slack",
  discord: "notification:discord",
  digest: "notification:digest",
  escalation: "notification:escalation",
};
