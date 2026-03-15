import { z } from "zod";

// ── Channel & Category Values (mirror DB enums) ──────────────────────

const channelTypeValues = [
  "push",
  "telegram",
  "email",
  "whatsapp",
  "sms",
  "instagram",
  "slack",
  "discord",
] as const;

const notificationCategoryValues = [
  "task_reminder",
  "overdue_alert",
  "streak_nudge",
  "daily_digest",
  "content_delivery",
  "team_update",
  "system",
] as const;

const digestModeValues = ["off", "hourly", "daily_am", "daily_pm"] as const;

// ── HH:mm regex ──────────────────────────────────────────────────────

const timeRegex = /^([01]\d|2[0-3]):[0-5]\d$/;

// ── Send Test ─────────────────────────────────────────────────────────

export const sendTestSchema = z.object({
  channel: z.enum(channelTypeValues),
});

// ── Delivery Status Query ─────────────────────────────────────────────

export const deliveryStatusQuerySchema = z.object({
  limit: z.coerce.number().int().min(1).max(100).default(20),
});

// ── Create Notification ──────────────────────────────────────────────

export const createNotificationSchema = z.object({
  taskId: z.string().uuid().optional(),
  type: z.enum(notificationCategoryValues),
  title: z.string().min(1).max(500),
  body: z.string().min(1).max(5000),
  actionUrl: z.string().url().max(2000).optional(),
  contentId: z.string().uuid().optional(),
  scheduledAt: z.coerce.date(),
  expiresAt: z.coerce.date().optional(),
  priority: z.number().int().min(1).max(10).default(5),
  cascadeId: z.string().uuid().optional(),
  cascadeOrder: z.number().int().min(0).default(0),
  metadata: z.string().max(10000).optional(),
});

// ── Update Notification Preferences ──────────────────────────────────

export const updateNotificationPreferencesSchema = z.object({
  primaryChannel: z.enum(channelTypeValues).optional(),
  fallbackChannel: z.enum(channelTypeValues).nullable().optional(),
  fallbackChain: z
    .array(z.enum(channelTypeValues))
    .max(8)
    .nullable()
    .optional(),
  quietStart: z
    .string()
    .regex(timeRegex, "Must be HH:mm format")
    .nullable()
    .optional(),
  quietEnd: z
    .string()
    .regex(timeRegex, "Must be HH:mm format")
    .nullable()
    .optional(),
  timezone: z.string().min(1).max(100).optional(),
  maxRemindersPerDay: z.number().int().min(1).max(100).optional(),
  digestMode: z.enum(digestModeValues).optional(),
  advanceReminderMinutes: z.number().int().min(0).max(1440).optional(),
});

// ── Update Team Notification Settings ────────────────────────────────

export const updateTeamNotificationSettingsSchema = z.object({
  taskAssigned: z.boolean().optional(),
  taskCompleted: z.boolean().optional(),
  commentOnTask: z.boolean().optional(),
  projectUpdate: z.boolean().optional(),
  dailyStandup: z.boolean().optional(),
});

// ── Type Exports ─────────────────────────────────────────────────────

export type SendTestInput = z.infer<typeof sendTestSchema>;
export type DeliveryStatusQuery = z.infer<typeof deliveryStatusQuerySchema>;
export type CreateNotificationInput = z.infer<
  typeof createNotificationSchema
>;
export type UpdateNotificationPreferencesInput = z.infer<
  typeof updateNotificationPreferencesSchema
>;
export type UpdateTeamNotificationSettingsInput = z.infer<
  typeof updateTeamNotificationSettingsSchema
>;
