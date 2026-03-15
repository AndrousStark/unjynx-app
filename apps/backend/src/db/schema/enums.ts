import { pgEnum } from "drizzle-orm/pg-core";

// ── Task ──────────────────────────────────────────────────────────────
export const taskPriorityEnum = pgEnum("task_priority", [
  "none",
  "low",
  "medium",
  "high",
  "urgent",
]);

export const taskStatusEnum = pgEnum("task_status", [
  "pending",
  "in_progress",
  "completed",
  "cancelled",
]);

// ── Notification Channels ─────────────────────────────────────────────
export const channelTypeEnum = pgEnum("channel_type", [
  "push",
  "telegram",
  "email",
  "whatsapp",
  "sms",
  "instagram",
  "slack",
  "discord",
]);

export const notificationStatusEnum = pgEnum("notification_status", [
  "pending",
  "queued",
  "sent",
  "delivered",
  "read",
  "failed",
]);

// ── Notification Categories ───────────────────────────────────────────
export const notificationCategoryEnum = pgEnum("notification_category", [
  "task_reminder",
  "overdue_alert",
  "streak_nudge",
  "daily_digest",
  "content_delivery",
  "team_update",
  "system",
]);

// ── Content ───────────────────────────────────────────────────────────
export const contentCategoryEnum = pgEnum("content_category", [
  "stoic_wisdom",
  "ancient_indian",
  "growth_mindset",
  "dark_humor",
  "anime",
  "gratitude",
  "warrior_discipline",
  "poetry",
  "productivity_hacks",
  "comeback_stories",
]);

// ── Rituals ───────────────────────────────────────────────────────────
export const ritualTypeEnum = pgEnum("ritual_type", [
  "morning",
  "evening",
]);

// ── Gamification ──────────────────────────────────────────────────────
export const xpSourceEnum = pgEnum("xp_source", [
  "task_complete",
  "task_last_minute",
  "ritual_complete",
  "ghost_mode",
  "pomodoro",
  "streak_milestone",
  "achievement",
]);

// ── User Plan ─────────────────────────────────────────────────────────
export const userPlanEnum = pgEnum("user_plan", [
  "free",
  "pro",
  "team",
  "enterprise",
]);

// ── Team Roles ────────────────────────────────────────────────────────
export const teamRoleEnum = pgEnum("team_role", [
  "owner",
  "admin",
  "member",
  "viewer",
]);

// ── Sync ──────────────────────────────────────────────────────────────
export const syncOperationEnum = pgEnum("sync_operation", [
  "create",
  "update",
  "delete",
]);

// ── Feature Flags ─────────────────────────────────────────────────────
export const featureFlagStatusEnum = pgEnum("feature_flag_status", [
  "enabled",
  "disabled",
  "percentage",
  "user_list",
]);

// ── Subscription ─────────────────────────────────────────────────────
export const subscriptionStatusEnum = pgEnum("subscription_status", [
  "active",
  "past_due",
  "cancelled",
  "expired",
]);

export const invoiceStatusEnum = pgEnum("invoice_status", [
  "paid",
  "pending",
  "refunded",
]);

// ── Accountability ───────────────────────────────────────────────────
export const partnerStatusEnum = pgEnum("partner_status", [
  "pending",
  "active",
  "declined",
]);

export const goalMetricEnum = pgEnum("goal_metric", [
  "tasks_completed",
  "streak_days",
  "focus_minutes",
]);

// ── Challenges ───────────────────────────────────────────────────────
export const challengeTypeEnum = pgEnum("challenge_type", [
  "task_count",
  "streak",
  "focus_time",
]);

export const challengeStatusEnum = pgEnum("challenge_status", [
  "pending",
  "active",
  "completed",
  "expired",
]);

// ── Team Invites ─────────────────────────────────────────────────────
export const teamInviteStatusEnum = pgEnum("team_invite_status", [
  "pending",
  "accepted",
  "declined",
  "expired",
]);

export const teamMemberStatusEnum = pgEnum("team_member_status", [
  "active",
  "invited",
  "deactivated",
]);

// ── Admin ────────────────────────────────────────────────────────────
export const adminRoleEnum = pgEnum("admin_role", [
  "user",
  "super_admin",
  "dev_admin",
]);
