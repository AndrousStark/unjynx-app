import { z } from "zod";

export const userListQuerySchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
  search: z.string().max(200).optional(),
  role: z.enum(["user", "super_admin", "dev_admin"]).optional(),
  status: z.enum(["active", "banned"]).optional(),
  sortBy: z.string().max(50).optional(),
  sortOrder: z.enum(["asc", "desc"]).default("desc"),
});

export const updateUserSchema = z.object({
  name: z.string().max(200).optional(),
  email: z.string().email().optional(),
  avatarUrl: z.string().url().nullable().optional(),
  timezone: z.string().max(100).optional(),
  adminRole: z.enum(["user", "super_admin", "dev_admin"]).optional(),
  isBanned: z.boolean().optional(),
  planOverride: z.enum(["free", "pro", "team", "enterprise"]).optional(),
});

export const createContentSchema = z.object({
  category: z.enum([
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
  ]),
  content: z.string().min(1).max(5000),
  author: z.string().max(200).optional(),
  source: z.string().max(200).optional(),
});

export const updateContentSchema = z.object({
  category: z
    .enum([
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
    ])
    .optional(),
  content: z.string().min(1).max(5000).optional(),
  author: z.string().max(200).nullable().optional(),
  source: z.string().max(200).nullable().optional(),
  isActive: z.boolean().optional(),
});

export const contentListQuerySchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
  category: z
    .enum([
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
    ])
    .optional(),
});

export const bulkImportContentSchema = z.object({
  items: z
    .array(createContentSchema)
    .min(1)
    .max(500),
});

export const createFeatureFlagSchema = z.object({
  key: z.string().min(1).max(100),
  name: z.string().min(1).max(200),
  description: z.string().max(1000).optional(),
  status: z.enum(["enabled", "disabled", "percentage", "user_list"]).default("disabled"),
  percentage: z.number().int().min(0).max(100).default(0),
});

export const updateFeatureFlagSchema = z.object({
  name: z.string().min(1).max(200).optional(),
  description: z.string().max(1000).nullable().optional(),
  status: z.enum(["enabled", "disabled", "percentage", "user_list"]).optional(),
  percentage: z.number().int().min(0).max(100).optional(),
});

export const auditLogQuerySchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
  action: z.string().max(100).optional(),
  userId: z.string().uuid().optional(),
});

export const analyticsQuerySchema = z.object({
  period: z.enum(["day", "week", "month", "year"]).default("month"),
});

export const broadcastSchema = z.object({
  title: z.string().min(1).max(200),
  body: z.string().min(1).max(2000),
  targetPlan: z.enum(["free", "pro", "team", "enterprise", "all"]).default("all"),
});

// ── User Management ──────────────────────────────────────────────────

export const createUserSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8).max(128),
  name: z.string().max(200).optional(),
  timezone: z.string().max(100).optional(),
  adminRole: z.enum(["user", "super_admin", "dev_admin"]).default("user"),
});

export const resetPasswordSchema = z.object({
  newPassword: z.string().min(8).max(128),
});

export const changeRoleSchema = z.object({
  role: z.enum(["user", "super_admin", "dev_admin"]),
});

export const assignTaskSchema = z.object({
  title: z.string().min(1).max(500),
  description: z.string().max(5000).optional(),
  priority: z.enum(["none", "low", "medium", "high", "urgent"]).default("none"),
  dueDate: z.string().datetime().optional(),
});

export const userTasksQuerySchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
});

// ── Analytics Extended ───────────────────────────────────────────────

export const trendQuerySchema = z.object({
  days: z.coerce.number().int().min(1).max(365).default(30),
});

// ── Notification Admin ──────────────────────────────────────────────

export const failedNotificationsQuerySchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
});

// ── Billing Admin ───────────────────────────────────────────────────

export const subscriptionListQuerySchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
  plan: z.enum(["free", "pro", "team", "enterprise"]).optional(),
  status: z.enum(["active", "past_due", "cancelled", "expired"]).optional(),
});

export const createCouponSchema = z.object({
  code: z.string().min(1).max(50).transform((v) => v.toUpperCase()),
  discountPercent: z.number().int().min(1).max(100),
  maxUses: z.number().int().min(1).max(100000),
  validUntil: z.string().datetime().optional(),
  isActive: z.boolean().default(true),
});

export const updateCouponSchema = z.object({
  discountPercent: z.number().int().min(1).max(100).optional(),
  maxUses: z.number().int().min(1).max(100000).optional(),
  validUntil: z.string().datetime().nullable().optional(),
  isActive: z.boolean().optional(),
});

// ── Support Admin ───────────────────────────────────────────────────

export const userActivityQuerySchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
});

// ── Type exports ─────────────────────────────────────────────────────

export type UserListQuery = z.infer<typeof userListQuerySchema>;
export type UpdateUserInput = z.infer<typeof updateUserSchema>;
export type CreateUserInput = z.infer<typeof createUserSchema>;
export type ResetPasswordInput = z.infer<typeof resetPasswordSchema>;
export type ChangeRoleInput = z.infer<typeof changeRoleSchema>;
export type AssignTaskInput = z.infer<typeof assignTaskSchema>;
export type UserTasksQuery = z.infer<typeof userTasksQuerySchema>;
export type CreateContentInput = z.infer<typeof createContentSchema>;
export type UpdateContentInput = z.infer<typeof updateContentSchema>;
export type ContentListQuery = z.infer<typeof contentListQuerySchema>;
export type BulkImportContentInput = z.infer<typeof bulkImportContentSchema>;
export type CreateFeatureFlagInput = z.infer<typeof createFeatureFlagSchema>;
export type UpdateFeatureFlagInput = z.infer<typeof updateFeatureFlagSchema>;
export type AuditLogQuery = z.infer<typeof auditLogQuerySchema>;
export type AnalyticsQuery = z.infer<typeof analyticsQuerySchema>;
export type BroadcastInput = z.infer<typeof broadcastSchema>;
export type TrendQuery = z.infer<typeof trendQuerySchema>;
export type FailedNotificationsQuery = z.infer<typeof failedNotificationsQuerySchema>;
export type SubscriptionListQuery = z.infer<typeof subscriptionListQuerySchema>;
export type CreateCouponInput = z.infer<typeof createCouponSchema>;
export type UpdateCouponInput = z.infer<typeof updateCouponSchema>;
export type UserActivityQuery = z.infer<typeof userActivityQuerySchema>;
