import type {
  Profile,
  DailyContentItem,
  FeatureFlag,
  AuditLogEntry,
  Task,
} from "../../db/schema/index.js";
import type {
  UserListQuery,
  UpdateUserInput,
  CreateUserInput,
  AssignTaskInput,
  CreateContentInput,
  UpdateContentInput,
  ContentListQuery,
  BulkImportContentInput,
  CreateFeatureFlagInput,
  UpdateFeatureFlagInput,
  AuditLogQuery,
  AnalyticsQuery,
  BroadcastInput,
  TrendQuery,
  SubscriptionListQuery,
  CreateCouponInput,
  UpdateCouponInput,
  UserActivityQuery,
} from "./admin.schema.js";
import { eq, and, ne, sql } from "drizzle-orm";
import * as adminRepo from "./admin.repository.js";
import * as broadcastRepo from "./broadcast.repository.js";
import * as logtoManagement from "./logto-management.service.js";
import * as siemWebhook from "./siem-webhook.service.js";
import { clearAdminCache } from "../../middleware/admin-guard.js";
import { dispatchJob } from "../scheduler/notification-dispatcher.js";
import { logger } from "../../middleware/logger.js";
import type { NotificationJobData } from "../../queue/types.js";
import { db } from "../../db/index.js";
import { profiles, featureFlags, userSessions } from "../../db/schema/index.js";

const log = logger.child({ module: "admin" });

// ── Users ─────────────────────────────────────────────────────────────

export async function listUsers(
  query: UserListQuery,
): Promise<{ items: adminRepo.ProfileWithPlan[]; total: number }> {
  const offset = (query.page - 1) * query.limit;
  return adminRepo.findUsers(
    query.search,
    query.limit,
    offset,
    query.role,
    query.sortBy,
    query.sortOrder,
    query.status,
  );
}

export async function getUserDetail(
  userId: string,
): Promise<adminRepo.ProfileWithPlan | undefined> {
  return adminRepo.findUserById(userId);
}

export async function updateUser(
  userId: string,
  input: UpdateUserInput,
): Promise<adminRepo.ProfileWithPlan | undefined> {
  const updates: Partial<Profile> = {};

  if (input.name !== undefined) {
    updates.name = input.name;
  }
  if (input.email !== undefined) {
    updates.email = input.email;
  }
  if (input.avatarUrl !== undefined) {
    updates.avatarUrl = input.avatarUrl;
  }
  if (input.timezone !== undefined) {
    updates.timezone = input.timezone;
  }
  if (input.adminRole !== undefined) {
    updates.adminRole = input.adminRole;
  }
  if (input.isBanned !== undefined) {
    updates.isBanned = input.isBanned;
  }

  // Fetch profile for Logto operations
  const profile = await adminRepo.findUserById(userId);
  if (!profile) return undefined;

  // Sync email/name changes to Logto if needed
  if (input.email !== undefined || input.name !== undefined) {
    if (profile.logtoId) {
      try {
        await logtoManagement.updateLogtoUser(profile.logtoId, {
          email: input.email,
          name: input.name,
        });
      } catch (error) {
        log.error({ err: error }, "Failed to sync user update to Logto");
        // Continue with local update even if Logto sync fails
      }
    }
  }

  // Sync ban/unban to Logto (suspend/unsuspend)
  if (input.isBanned !== undefined && profile.logtoId) {
    try {
      await logtoManagement.suspendLogtoUser(profile.logtoId, input.isBanned);
    } catch (error) {
      log.error({ err: error }, "Failed to sync ban status to Logto");
    }
  }

  // If role changed, clear admin cache so it takes effect immediately
  if (input.adminRole !== undefined) {
    clearAdminCache();
  }

  // If plan changed, create or update the user's subscription
  if (input.planOverride !== undefined) {
    await adminRepo.upsertUserSubscription(userId, input.planOverride);
  }

  // Update the profile (only profile fields, not subscription)
  const hasProfileUpdates = Object.keys(updates).length > 0;
  if (hasProfileUpdates) {
    await adminRepo.updateUser(userId, updates);
  }

  // Return fresh user with plan
  return adminRepo.findUserById(userId);
}

// ── User Management ──────────────────────────────────────────────────

/**
 * Create a new user in Logto and create a local profile.
 * Rolls back the Logto user if local profile creation fails.
 */
export async function createUser(
  input: CreateUserInput,
): Promise<Profile> {
  // Step 1: Create user in Logto
  const logtoId = await logtoManagement.createLogtoUser(
    input.email,
    input.password,
    input.name,
  );

  try {
    // Step 2: Create local profile
    const profile = await adminRepo.createProfile({
      logtoId,
      email: input.email,
      name: input.name,
      timezone: input.timezone,
      adminRole: input.adminRole,
    });

    return profile;
  } catch (error) {
    // Rollback: delete the Logto user since profile creation failed
    try {
      await logtoManagement.deleteLogtoUser(logtoId);
    } catch (rollbackError) {
      log.error({ err: rollbackError }, "Failed to rollback Logto user after profile creation failure");
    }
    throw error;
  }
}

/**
 * Delete a user from both local DB and Logto.
 * Prevents self-deletion.
 */
export async function deleteUser(
  userId: string,
  actorId: string,
): Promise<void> {
  if (actorId === userId) {
    throw new Error("Cannot delete your own account");
  }

  const profile = await adminRepo.findUserById(userId);
  if (!profile) {
    throw new Error("User not found");
  }

  // Delete local profile first (cascades to tasks, etc.)
  const deleted = await adminRepo.deleteProfile(userId);
  if (!deleted) {
    throw new Error("Failed to delete user profile");
  }

  // Delete from Logto
  if (profile.logtoId) {
    try {
      await logtoManagement.deleteLogtoUser(profile.logtoId);
    } catch (error) {
      log.error({ err: error }, "Failed to delete Logto user after profile deletion");
      // Profile is already deleted locally — log but don't throw
    }
  }
}

/**
 * Reset a user's password via Logto Management API.
 */
export async function resetUserPassword(
  userId: string,
  newPassword: string,
): Promise<void> {
  const profile = await adminRepo.findUserById(userId);
  if (!profile) {
    throw new Error("User not found");
  }
  if (!profile.logtoId) {
    throw new Error("User has no Logto account linked");
  }

  await logtoManagement.setLogtoPassword(profile.logtoId, newPassword);
}

/**
 * Change a user's admin role.
 * Prevents self-demotion (admin cannot downgrade their own role).
 */
export async function changeUserRole(
  userId: string,
  newRole: string,
  actorId: string,
): Promise<Profile> {
  if (actorId === userId) {
    throw new Error("Cannot change your own role");
  }

  const profile = await adminRepo.findUserById(userId);
  if (!profile) {
    throw new Error("User not found");
  }

  const updated = await adminRepo.updateUser(userId, {
    adminRole: newRole as Profile["adminRole"],
  });

  if (!updated) {
    throw new Error("Failed to update user role");
  }

  // Clear admin cache so the role change takes effect immediately
  clearAdminCache();

  return updated;
}

/**
 * Assign a task to a user (admin action).
 */
export async function assignTaskToUser(
  userId: string,
  input: AssignTaskInput,
): Promise<Task> {
  const profile = await adminRepo.findUserById(userId);
  if (!profile) {
    throw new Error("User not found");
  }

  return adminRepo.createTask({
    userId,
    title: input.title,
    description: input.description,
    priority: input.priority,
    dueDate: input.dueDate ? new Date(input.dueDate) : undefined,
  });
}

/**
 * Get paginated tasks for a specific user.
 */
export async function getUserTasks(
  userId: string,
  page: number,
  limit: number,
): Promise<{ items: Task[]; total: number }> {
  const offset = (page - 1) * limit;
  return adminRepo.getUserTasks(userId, limit, offset);
}

/**
 * Get task statistics for a specific user.
 */
export async function getUserStats(
  userId: string,
): Promise<adminRepo.UserStats> {
  return adminRepo.getUserStats(userId);
}

// ── Content ───────────────────────────────────────────────────────────

export async function listContent(
  query: ContentListQuery,
): Promise<{ items: DailyContentItem[]; total: number }> {
  const offset = (query.page - 1) * query.limit;
  return adminRepo.findContent(query.category, query.limit, offset);
}

export async function createContent(
  input: CreateContentInput,
): Promise<DailyContentItem> {
  return adminRepo.insertContent({
    category: input.category,
    content: input.content,
    author: input.author,
    source: input.source,
  });
}

export async function updateContent(
  contentId: string,
  input: UpdateContentInput,
): Promise<DailyContentItem | undefined> {
  return adminRepo.updateContent(contentId, input);
}

export async function deleteContent(
  contentId: string,
): Promise<boolean> {
  return adminRepo.deleteContent(contentId);
}

export async function bulkImportContent(
  input: BulkImportContentInput,
): Promise<DailyContentItem[]> {
  const data = input.items.map((item) => ({
    category: item.category,
    content: item.content,
    author: item.author,
    source: item.source,
  }));

  return adminRepo.bulkInsertContent(data);
}

// ── Feature Flags ─────────────────────────────────────────────────────

export async function listFeatureFlags(): Promise<FeatureFlag[]> {
  return adminRepo.findFeatureFlags();
}

export async function getFeatureFlag(
  id: string,
): Promise<FeatureFlag | undefined> {
  return adminRepo.findFeatureFlagById(id);
}

export async function createFeatureFlag(
  input: CreateFeatureFlagInput,
): Promise<FeatureFlag> {
  return adminRepo.insertFeatureFlag({
    key: input.key,
    name: input.name,
    description: input.description,
    status: input.status,
    percentage: input.percentage,
  });
}

export async function updateFeatureFlag(
  id: string,
  input: UpdateFeatureFlagInput,
): Promise<FeatureFlag | undefined> {
  return adminRepo.updateFeatureFlag(id, input);
}

export async function deleteFeatureFlag(
  id: string,
): Promise<boolean> {
  return adminRepo.deleteFeatureFlag(id);
}

// ── Audit Log ─────────────────────────────────────────────────────────

export async function getAuditLog(
  query: AuditLogQuery,
): Promise<{ items: AuditLogEntry[]; total: number }> {
  const offset = (query.page - 1) * query.limit;
  return adminRepo.findAuditLog(
    { action: query.action, userId: query.userId },
    query.limit,
    offset,
  );
}

export async function logAuditEvent(
  userId: string,
  action: string,
  resourceType: string,
  resourceId?: string,
  details?: Record<string, unknown>,
  ipAddress?: string,
): Promise<AuditLogEntry> {
  const entry = await adminRepo.insertAuditEntry({
    userId,
    action,
    entityType: resourceType,
    entityId: resourceId,
    metadata: details ? JSON.stringify(details) : undefined,
    ipAddress,
  });

  // Forward to SIEM (non-blocking, fire-and-forget)
  siemWebhook.forwardToSiem({
    timestamp: entry.createdAt.toISOString(),
    actor: userId,
    action,
    target: resourceType,
    targetId: resourceId,
    metadata: details,
    ipAddress,
  });

  return entry;
}

// ── Analytics ─────────────────────────────────────────────────────────

export async function getAnalyticsOverview(): Promise<adminRepo.AnalyticsOverview> {
  return adminRepo.getAnalyticsOverview();
}

export async function getSignupTrend(
  days: number,
): Promise<adminRepo.TrendPoint[]> {
  return adminRepo.getSignupTrend(days);
}

export async function getDauTrend(
  days: number,
): Promise<adminRepo.TrendPoint[]> {
  return adminRepo.getDauTrend(days);
}

export async function getPlanDistribution(): Promise<adminRepo.PlanDistribution[]> {
  return adminRepo.getPlanDistribution();
}

export async function getTaskActivity(
  days: number,
): Promise<adminRepo.TaskActivityPoint[]> {
  return adminRepo.getTaskActivity(days);
}

export async function getRevenueTrend(
  days: number,
): Promise<adminRepo.RevenuePoint[]> {
  return adminRepo.getRevenueTrend(days);
}

export async function getNotificationStats(): Promise<adminRepo.NotificationChannelStats[]> {
  return adminRepo.getNotificationStats();
}

// ── Broadcast ─────────────────────────────────────────────────────────

export interface BroadcastResult {
  readonly sent: boolean;
  readonly targetCount: number;
  readonly dispatched: number;
  readonly failed: number;
}

/**
 * Send a broadcast notification to users filtered by plan.
 *
 * 1. Queries active user IDs by plan filter (profiles + subscriptions via `db`).
 * 2. For each user, looks up their primary notification channel (notification_preferences via `contentDb`).
 * 3. Creates a notification record and dispatches delivery via the notification dispatcher.
 * 4. Returns the actual count of users targeted.
 */
export async function sendBroadcast(
  input: BroadcastInput,
): Promise<BroadcastResult> {
  // Step 1: Get target users by plan filter
  const targetUsers = await broadcastRepo.findBroadcastTargets(input.targetPlan);

  if (targetUsers.length === 0) {
    log.info({ targetPlan: input.targetPlan }, "Broadcast: no users matched filter");
    return { sent: true, targetCount: 0, dispatched: 0, failed: 0 };
  }

  log.info(
    { targetPlan: input.targetPlan, targetCount: targetUsers.length },
    "Broadcast: dispatching to users",
  );

  // Step 2: Get notification preferences for all target users (primary channel)
  const userPrefs = await broadcastRepo.findUserPrimaryChannels(
    targetUsers.map((u) => u.id),
  );

  // Build a map of userId -> primaryChannel for quick lookup
  const channelMap = new Map<string, string>();
  for (const pref of userPrefs) {
    channelMap.set(pref.userId, pref.primaryChannel);
  }

  // Step 3: Dispatch notifications
  let dispatched = 0;
  let failed = 0;

  for (const user of targetUsers) {
    const channel = channelMap.get(user.id) ?? "push"; // Default to push if no preference

    const job: NotificationJobData = {
      userId: user.id,
      notificationId: crypto.randomUUID(),
      channel,
      messageType: "system",
      templateVars: {
        title: input.title,
        body: input.body,
        _recipient: "", // Resolved by dispatcher from connected channels
      },
      priority: 5, // Normal priority for broadcasts
      attemptNumber: 1,
    };

    try {
      const result = await dispatchJob(job);
      if (result.success) {
        dispatched += 1;
      } else {
        failed += 1;
        log.warn(
          { userId: user.id, channel, reason: result.reason },
          "Broadcast: dispatch failed for user",
        );
      }
    } catch (error) {
      failed += 1;
      log.error(
        { userId: user.id, channel, error },
        "Broadcast: exception dispatching to user",
      );
    }
  }

  log.info(
    { targetCount: targetUsers.length, dispatched, failed },
    "Broadcast: dispatch complete",
  );

  return {
    sent: true,
    targetCount: targetUsers.length,
    dispatched,
    failed,
  };
}

// ── Notification Admin ───────────────────────────────────────────────

export async function getNotificationQueueStatus(): Promise<adminRepo.QueueStatus> {
  return adminRepo.getNotificationQueueStatus();
}

export async function getFailedNotifications(
  page: number,
  limit: number,
): Promise<{ items: import("../../db/schema/index.js").DeliveryAttempt[]; total: number }> {
  const offset = (page - 1) * limit;
  return adminRepo.findFailedNotifications(limit, offset);
}

export async function retryNotification(
  attemptId: string,
): Promise<import("../../db/schema/index.js").DeliveryAttempt | undefined> {
  return adminRepo.resetDeliveryAttempt(attemptId);
}

export async function retryAllNotifications(): Promise<number> {
  return adminRepo.resetAllFailedAttempts();
}

// ── Billing Admin ────────────────────────────────────────────────────

export async function listSubscriptions(
  query: SubscriptionListQuery,
): Promise<{ items: import("../../db/schema/index.js").Subscription[]; total: number }> {
  const offset = (query.page - 1) * query.limit;
  return adminRepo.findAllSubscriptions(query.limit, offset, query.plan, query.status);
}

export async function getBillingStats(): Promise<adminRepo.BillingStats> {
  return adminRepo.getBillingStats();
}

export async function listCoupons(): Promise<import("../../db/schema/index.js").Coupon[]> {
  return adminRepo.findAllCoupons();
}

export async function createCoupon(
  input: CreateCouponInput,
): Promise<import("../../db/schema/index.js").Coupon> {
  return adminRepo.insertCoupon({
    code: input.code,
    discountPercent: input.discountPercent,
    maxUses: input.maxUses,
    validUntil: input.validUntil ? new Date(input.validUntil) : undefined,
    isActive: input.isActive,
  });
}

export async function updateCoupon(
  id: string,
  input: UpdateCouponInput,
): Promise<import("../../db/schema/index.js").Coupon | undefined> {
  const updates: Record<string, unknown> = {};
  if (input.discountPercent !== undefined) updates.discountPercent = input.discountPercent;
  if (input.maxUses !== undefined) updates.maxUses = input.maxUses;
  if (input.validUntil !== undefined) {
    updates.validUntil = input.validUntil ? new Date(input.validUntil) : null;
  }
  if (input.isActive !== undefined) updates.isActive = input.isActive;

  return adminRepo.updateCoupon(id, updates);
}

export async function deleteCoupon(id: string): Promise<boolean> {
  return adminRepo.deleteCoupon(id);
}

// ── Support Admin ────────────────────────────────────────────────────

export async function getAccountHealth(
  userId: string,
): Promise<adminRepo.AccountHealth | null> {
  return adminRepo.getAccountHealth(userId);
}

// ── User Activity ────────────────────────────────────────────────────

export async function getUserActivity(
  userId: string,
  page: number,
  limit: number,
): Promise<{ items: AuditLogEntry[]; total: number }> {
  const offset = (page - 1) * limit;
  return adminRepo.findUserActivity(userId, limit, offset);
}

// ── Compliance ───────────────────────────────────────────────────────

export async function getComplianceSummary(): Promise<adminRepo.ComplianceSummary> {
  return adminRepo.getComplianceSummary();
}

// ── Content Detail ──────────────────────────────────────────────────

export async function getContentDetail(
  contentId: string,
): Promise<adminRepo.ContentDetail | null> {
  return adminRepo.findContentById(contentId);
}

// ── Coupon Detail ───────────────────────────────────────────────────

export async function getCouponDetail(
  couponId: string,
): Promise<adminRepo.CouponDetail | null> {
  return adminRepo.findCouponDetailById(couponId);
}

export async function getCouponRedemptions(
  couponId: string,
  page: number,
  limit: number,
): Promise<{ items: adminRepo.CouponRedemptionWithUser[]; total: number }> {
  const offset = (page - 1) * limit;
  return adminRepo.findCouponRedemptions(couponId, limit, offset);
}

// ── Subscription Detail ─────────────────────────────────────────────

export async function getSubscriptionDetail(
  subscriptionId: string,
): Promise<adminRepo.SubscriptionDetail | null> {
  return adminRepo.findSubscriptionById(subscriptionId);
}

// ── SIEM Config ─────────────────────────────────────────────────────

export async function getSiemConfig(): Promise<siemWebhook.SiemConfig> {
  return siemWebhook.getSiemConfig();
}

export async function updateSiemConfig(
  webhookUrl: string | undefined,
  webhookSecret: string | undefined,
  enabled: boolean | undefined,
): Promise<siemWebhook.SiemConfig> {
  return siemWebhook.updateSiemConfig(webhookUrl, webhookSecret, enabled);
}

export async function testSiemWebhook(): Promise<{
  readonly success: boolean;
  readonly message: string;
}> {
  return siemWebhook.sendTestEvent();
}

// ── Panic Mode ──────────────────────────────────────────────────────

export interface PanicModeStatus {
  readonly active: boolean;
  readonly activatedAt: string | null;
  readonly activatedBy: string | null;
  readonly reason: string | null;
}

/**
 * Activate panic mode:
 * 1. Set global flag (feature_flags: key="panic_mode", status="enabled")
 * 2. Suspend ALL users except the activator (owner)
 * 3. Revoke all active sessions except the activator's
 * 4. Audit log with timestamp and reason
 */
export async function activatePanicMode(
  activatedBy: string,
  reason: string,
): Promise<PanicModeStatus> {
  const now = new Date();

  // Step 1: Upsert the panic_mode feature flag
  const existingFlags = await db
    .select()
    .from(featureFlags)
    .where(eq(featureFlags.key, "panic_mode"))
    .limit(1);

  const metadata = JSON.stringify({
    reason,
    activatedBy,
    activatedAt: now.toISOString(),
  });

  if (existingFlags.length > 0) {
    await db
      .update(featureFlags)
      .set({
        status: "enabled",
        description: metadata,
        updatedAt: now,
      })
      .where(eq(featureFlags.key, "panic_mode"));
  } else {
    await db
      .insert(featureFlags)
      .values({
        key: "panic_mode",
        name: "Panic Mode",
        status: "enabled",
        description: metadata,
      });
  }

  // Step 2: Suspend all non-owner users (set accountStatus to "suspended")
  await db
    .update(profiles)
    .set({
      accountStatus: "suspended",
      suspendedReason: `Panic mode: ${reason}`,
      updatedAt: now,
    })
    .where(
      and(
        ne(profiles.id, activatedBy),
        ne(profiles.accountStatus, "suspended"),
      ),
    );

  // Step 3: Revoke all active sessions except the activator's
  await db
    .update(userSessions)
    .set({ isRevoked: true })
    .where(
      and(
        ne(userSessions.userId, activatedBy),
        eq(userSessions.isRevoked, false),
      ),
    );

  // Step 4: Audit log
  await logAuditEvent(
    activatedBy,
    "panic_mode.activate",
    "system",
    undefined,
    { reason, activatedAt: now.toISOString() },
  );

  log.warn(
    { activatedBy, reason },
    "PANIC MODE ACTIVATED: All users suspended, sessions revoked",
  );

  return {
    active: true,
    activatedAt: now.toISOString(),
    activatedBy,
    reason,
  };
}

/**
 * Deactivate panic mode:
 * 1. Disable the panic_mode flag
 * 2. Reactivate all previously-panic-suspended users
 * 3. Audit log
 */
export async function deactivatePanicMode(
  deactivatedBy: string,
): Promise<PanicModeStatus> {
  const now = new Date();

  // Step 1: Disable the panic_mode feature flag
  await db
    .update(featureFlags)
    .set({
      status: "disabled",
      updatedAt: now,
    })
    .where(eq(featureFlags.key, "panic_mode"));

  // Step 2: Reactivate all panic-suspended users
  // Match users whose suspendedReason starts with "Panic mode:"
  await db.execute(
    sql`UPDATE profiles SET account_status = 'active', suspended_reason = NULL, updated_at = ${now} WHERE account_status = 'suspended' AND suspended_reason LIKE 'Panic mode:%'`,
  );

  // Step 3: Audit log
  await logAuditEvent(
    deactivatedBy,
    "panic_mode.deactivate",
    "system",
    undefined,
    { deactivatedAt: now.toISOString() },
  );

  log.info(
    { deactivatedBy },
    "PANIC MODE DEACTIVATED: Suspended users reactivated",
  );

  return {
    active: false,
    activatedAt: null,
    activatedBy: null,
    reason: null,
  };
}

/**
 * Get current panic mode status from the feature_flags table.
 */
export async function getPanicModeStatus(): Promise<PanicModeStatus> {
  const [flag] = await db
    .select()
    .from(featureFlags)
    .where(eq(featureFlags.key, "panic_mode"))
    .limit(1);

  if (!flag || flag.status !== "enabled") {
    return {
      active: false,
      activatedAt: null,
      activatedBy: null,
      reason: null,
    };
  }

  // Parse the stored metadata from description
  try {
    const meta = JSON.parse(flag.description ?? "{}") as {
      reason?: string;
      activatedBy?: string;
      activatedAt?: string;
    };
    return {
      active: true,
      activatedAt: meta.activatedAt ?? flag.updatedAt.toISOString(),
      activatedBy: meta.activatedBy ?? null,
      reason: meta.reason ?? null,
    };
  } catch {
    return {
      active: true,
      activatedAt: flag.updatedAt.toISOString(),
      activatedBy: null,
      reason: null,
    };
  }
}
