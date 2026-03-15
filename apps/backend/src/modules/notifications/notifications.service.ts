import type {
  NotificationPreference,
  DeliveryAttempt,
} from "../../db/schema/index.js";
import type { UpdateNotificationPreferencesInput } from "./notifications.schema.js";
import * as notificationRepo from "./notifications.repository.js";

// ── Provider Map (channel -> provider name for delivery attempts) ────
const CHANNEL_PROVIDER_MAP: Readonly<Record<string, string>> = {
  push: "fcm",
  telegram: "telegram-bot-api",
  email: "sendgrid",
  whatsapp: "gupshup",
  sms: "msg91",
  instagram: "messenger-api",
  slack: "slack-api",
  discord: "discord-api",
};

// ── Quota Limits per Plan ─────────────────────────────────────────────
const QUOTA_LIMITS: Readonly<Record<string, Readonly<Record<string, number>>>> =
  {
    free: { push: 999, telegram: 999, email: 5 },
    pro: {
      push: 999,
      telegram: 999,
      email: 50,
      whatsapp: 10,
      sms: 5,
      instagram: 3,
      slack: 10,
      discord: 10,
    },
    team: {
      push: 999,
      telegram: 999,
      email: 100,
      whatsapp: 15,
      sms: 10,
      instagram: 5,
      slack: 20,
      discord: 20,
    },
  };

const ALL_CHANNELS = [
  "push",
  "telegram",
  "email",
  "whatsapp",
  "sms",
  "instagram",
  "slack",
  "discord",
] as const;

// ── Default Preferences ──────────────────────────────────────────────
const DEFAULT_PREFERENCES: Omit<
  NotificationPreference,
  "createdAt" | "updatedAt"
> = {
  userId: "",
  primaryChannel: "push",
  fallbackChannel: null,
  fallbackChain: null,
  quietStart: null,
  quietEnd: null,
  timezone: "UTC",
  maxRemindersPerDay: 20,
  digestMode: "off",
  advanceReminderMinutes: 15,
};

// ── Send Test Notification ───────────────────────────────────────────
export async function sendTestNotification(
  userId: string,
  channel: string,
): Promise<void> {
  const notification = await notificationRepo.insertNotification({
    userId,
    type: "system",
    title: "Test Notification",
    body: `This is a test notification via ${channel}.`,
    scheduledAt: new Date(),
    priority: 1,
  });

  await notificationRepo.insertDeliveryAttempt({
    notificationId: notification.id,
    channel: channel as (typeof ALL_CHANNELS)[number],
    provider: CHANNEL_PROVIDER_MAP[channel] ?? "unknown",
    status: "queued",
    queuedAt: new Date(),
  });
}

// ── Get Delivery Status ──────────────────────────────────────────────
export async function getDeliveryStatus(
  userId: string,
  limit: number = 20,
): Promise<DeliveryAttempt[]> {
  return notificationRepo.findRecentDeliveryAttemptsByUser(userId, limit);
}

// ── Get Quota Usage ──────────────────────────────────────────────────
export async function getQuotaUsage(
  userId: string,
): Promise<Record<string, { readonly used: number; readonly limit: number }>> {
  // Default to "free" plan. In production, this would look up the user's plan.
  const planLimits = QUOTA_LIMITS["free"] ?? {};

  const usagePromises = ALL_CHANNELS.map(async (channel) => {
    const used = await notificationRepo.getDailyUsageCount(userId, channel);
    const limit = planLimits[channel] ?? 0;
    return { channel, used, limit };
  });

  const usageResults = await Promise.all(usagePromises);

  const usage: Record<
    string,
    { readonly used: number; readonly limit: number }
  > = {};

  for (const { channel, used, limit } of usageResults) {
    usage[channel] = { used, limit };
  }

  return usage;
}

// ── Get Preferences ──────────────────────────────────────────────────
export async function getPreferences(
  userId: string,
): Promise<NotificationPreference> {
  const existing = await notificationRepo.getPreferences(userId);

  if (existing) {
    return existing;
  }

  // Return defaults with user-specific userId (without persisting)
  return {
    ...DEFAULT_PREFERENCES,
    userId,
    createdAt: new Date(),
    updatedAt: new Date(),
  };
}

// ── Update Preferences ───────────────────────────────────────────────
export async function updatePreferences(
  userId: string,
  input: UpdateNotificationPreferencesInput,
): Promise<NotificationPreference> {
  const data: Record<string, unknown> = {};

  if (input.primaryChannel !== undefined) {
    data.primaryChannel = input.primaryChannel;
  }
  if (input.fallbackChannel !== undefined) {
    data.fallbackChannel = input.fallbackChannel;
  }
  if (input.fallbackChain !== undefined) {
    data.fallbackChain = JSON.stringify(input.fallbackChain);
  }
  if (input.quietStart !== undefined) {
    data.quietStart = input.quietStart;
  }
  if (input.quietEnd !== undefined) {
    data.quietEnd = input.quietEnd;
  }
  if (input.timezone !== undefined) {
    data.timezone = input.timezone;
  }
  if (input.maxRemindersPerDay !== undefined) {
    data.maxRemindersPerDay = input.maxRemindersPerDay;
  }
  if (input.digestMode !== undefined) {
    data.digestMode = input.digestMode;
  }
  if (input.advanceReminderMinutes !== undefined) {
    data.advanceReminderMinutes = input.advanceReminderMinutes;
  }

  return notificationRepo.upsertPreferences(userId, data);
}
