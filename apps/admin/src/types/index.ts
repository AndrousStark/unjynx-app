// ── API Response Envelope ─────────────────────────────────────────────
export interface ApiResponse<T> {
  readonly success: boolean;
  readonly data: T | null;
  readonly error: string | null;
  readonly meta?: PaginationMeta;
}

export interface PaginationMeta {
  readonly total: number;
  readonly page: number;
  readonly limit: number;
  readonly totalPages: number;
}

// ── RBAC ─────────────────────────────────────────────────────────────
export type AdminRole =
  | "SUPER_ADMIN"
  | "CONTENT_MANAGER"
  | "SUPPORT_AGENT"
  | "VIEWER";

export interface AdminUser {
  readonly id: string;
  readonly email: string;
  readonly name: string;
  readonly avatarUrl?: string;
  readonly role: AdminRole;
}

// ── Users ────────────────────────────────────────────────────────────
export type PlanType = "free" | "pro" | "team" | "enterprise";
export type UserStatus = "active" | "suspended" | "banned";

export interface UserRecord {
  readonly id: string;
  readonly name: string;
  readonly email: string;
  readonly avatarUrl?: string;
  readonly plan: PlanType;
  readonly status: UserStatus;
  readonly isBanned: boolean;
  readonly createdAt: string;
  readonly updatedAt: string;
  readonly tasksCount?: number;
  readonly adminRole?: string;
  readonly logtoId?: string;
  readonly timezone?: string;
}

// ── App Admin Roles ──────────────────────────────────────────────────
export type AppAdminRole = "user" | "super_admin" | "dev_admin";

export interface UserStats {
  readonly totalTasks: number;
  readonly completedTasks: number;
  readonly pendingTasks: number;
}

export interface TaskSummary {
  readonly id: string;
  readonly title: string;
  readonly status: string;
  readonly priority: string;
  readonly dueDate: string | null;
  readonly createdAt: string;
}

export interface CreateUserInput {
  readonly email: string;
  readonly password: string;
  readonly name?: string;
  readonly timezone?: string;
  readonly adminRole?: AppAdminRole;
}

export interface AssignTaskInput {
  readonly title: string;
  readonly description?: string;
  readonly priority?: string;
  readonly dueDate?: string;
}

// ── Content ──────────────────────────────────────────────────────────
export type ContentCategory =
  | "stoic_wisdom"
  | "ancient_indian"
  | "growth_mindset"
  | "dark_humor"
  | "anime"
  | "gratitude"
  | "warrior_discipline"
  | "poetry"
  | "productivity_hacks"
  | "comeback_stories";

export type ContentStatus =
  | "draft"
  | "pending"
  | "approved"
  | "scheduled"
  | "published";

export interface ContentRecord {
  readonly id: string;
  readonly category: ContentCategory;
  readonly content: string;
  readonly author?: string;
  readonly source?: string;
  readonly status: ContentStatus;
  readonly isActive: boolean;
  readonly scheduledAt?: string;
  readonly createdAt: string;
  readonly updatedAt: string;
}

// ── Feature Flags ────────────────────────────────────────────────────
export type FlagStatus = "enabled" | "disabled" | "percentage" | "user_list";
export type FlagType = "release" | "experiment" | "ops" | "permission";

export interface FeatureFlagRecord {
  readonly id: string;
  readonly key: string;
  readonly name: string;
  readonly description?: string;
  readonly status: FlagStatus;
  readonly flagType: FlagType;
  readonly percentage: number;
  readonly createdAt: string;
  readonly updatedAt: string;
}

// ── Audit Log ────────────────────────────────────────────────────────
export interface AuditLogRecord {
  readonly id: string;
  readonly userId: string;
  readonly action: string;
  readonly entityType: string;
  readonly entityId?: string;
  readonly metadata?: string;
  readonly ipAddress?: string;
  readonly createdAt: string;
}

// ── Analytics ────────────────────────────────────────────────────────
export interface AnalyticsOverview {
  readonly totalUsers: number;
  readonly activeUsersToday: number;
  readonly activeUsersMonth: number;
  readonly totalSubscriptions: number;
}

export interface GrowthPoint {
  readonly date: string;
  readonly count: number;
}

export interface RevenuePoint {
  readonly date: string;
  readonly amount: number;
  readonly currency: string;
}

// ── Notifications ────────────────────────────────────────────────────
export type ChannelType =
  | "push"
  | "whatsapp"
  | "telegram"
  | "email"
  | "sms"
  | "instagram"
  | "slack"
  | "discord";

export interface ChannelHealth {
  readonly channel: ChannelType;
  readonly status: "healthy" | "degraded" | "down";
  readonly successRate: number;
  readonly lastDelivery: string;
  readonly queueSize: number;
  readonly costToday: number;
}

export interface QueueStatus {
  readonly name: string;
  readonly active: number;
  readonly waiting: number;
  readonly completed: number;
  readonly failed: number;
}

export interface FailedNotification {
  readonly id: string;
  readonly userId: string;
  readonly channel: ChannelType;
  readonly error: string;
  readonly attempts: number;
  readonly createdAt: string;
}

// ── Billing ──────────────────────────────────────────────────────────
export interface SubscriptionRecord {
  readonly id: string;
  readonly userId: string;
  readonly userName: string;
  readonly plan: PlanType;
  readonly status: "active" | "cancelled" | "past_due" | "trialing";
  readonly currentPeriodEnd: string;
  readonly amount: number;
  readonly currency: string;
  readonly createdAt: string;
}

export interface CouponRecord {
  readonly id: string;
  readonly code: string;
  readonly discountPercent: number;
  readonly maxUses: number;
  readonly usedCount: number;
  readonly expiresAt: string;
  readonly isActive: boolean;
  readonly createdAt: string;
}

// ── Support ──────────────────────────────────────────────────────────
export interface AccountHealth {
  readonly userId: string;
  readonly score: number;
  readonly syncStatus: "ok" | "behind" | "failed";
  readonly lastLogin: string;
  readonly openTickets: number;
  readonly failedNotifications: number;
}
