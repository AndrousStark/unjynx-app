import { Hono } from "hono";
import { zValidator } from "@hono/zod-validator";
import { authMiddleware } from "../../middleware/auth.js";
import { adminGuard } from "../../middleware/admin-guard.js";
import { ok, err, paginated } from "../../types/api.js";
import {
  userListQuerySchema,
  updateUserSchema,
  createUserSchema,
  resetPasswordSchema,
  changeRoleSchema,
  assignTaskSchema,
  userTasksQuerySchema,
  contentListQuerySchema,
  createContentSchema,
  updateContentSchema,
  bulkImportContentSchema,
  createFeatureFlagSchema,
  updateFeatureFlagSchema,
  auditLogQuerySchema,
  analyticsQuerySchema,
  broadcastSchema,
  trendQuerySchema,
  failedNotificationsQuerySchema,
  subscriptionListQuerySchema,
  createCouponSchema,
  updateCouponSchema,
  userActivityQuerySchema,
  loginEventsQuerySchema,
} from "./admin.schema.js";
import * as adminService from "./admin.service.js";
import * as loginAuditService from "../auth/login-audit.service.js";

export const adminRoutes = new Hono();

adminRoutes.use("/*", authMiddleware);
adminRoutes.use("/*", adminGuard("owner", "admin"));

// ── Users ─────────────────────────────────────────────────────────────

// GET /admin/users - List users (paginated, searchable)
adminRoutes.get(
  "/users",
  zValidator("query", userListQuerySchema),
  async (c) => {
    const query = c.req.valid("query");
    const { items, total } = await adminService.listUsers(query);
    return c.json(paginated(items, total, query.page, query.limit));
  },
);

// GET /admin/users/:id - User detail
adminRoutes.get("/users/:id", async (c) => {
  const userId = c.req.param("id");
  const user = await adminService.getUserDetail(userId);

  if (!user) {
    return c.json(err("User not found"), 404);
  }

  return c.json(ok(user));
});

// PATCH /admin/users/:id - Update user
adminRoutes.patch(
  "/users/:id",
  zValidator("json", updateUserSchema),
  async (c) => {
    const auth = c.get("auth");
    const userId = c.req.param("id");
    const input = c.req.valid("json");
    const user = await adminService.updateUser(userId, input);

    if (!user) {
      return c.json(err("User not found"), 404);
    }

    // Audit log
    await adminService.logAuditEvent(
      auth.profileId,
      "user.update",
      "profile",
      userId,
      input,
      c.req.header("x-forwarded-for") ?? c.req.header("x-real-ip"),
    );

    return c.json(ok(user));
  },
);

// POST /admin/users - Create user (super_admin only)
adminRoutes.post(
  "/users",
  adminGuard("owner"),
  zValidator("json", createUserSchema),
  async (c) => {
    const auth = c.get("auth");
    const input = c.req.valid("json");

    try {
      const user = await adminService.createUser(input);

      await adminService.logAuditEvent(
        auth.profileId,
        "user.create",
        "profile",
        user.id,
        { email: input.email, adminRole: input.adminRole },
        c.req.header("x-forwarded-for") ?? c.req.header("x-real-ip"),
      );

      return c.json(ok(user), 201);
    } catch (error) {
      return c.json(err((error as Error).message), 400);
    }
  },
);

// DELETE /admin/users/:id - Delete user (super_admin only)
adminRoutes.delete(
  "/users/:id",
  adminGuard("owner"),
  async (c) => {
    const auth = c.get("auth");
    const userId = c.req.param("id");

    try {
      await adminService.deleteUser(userId, auth.profileId);

      await adminService.logAuditEvent(
        auth.profileId,
        "user.delete",
        "profile",
        userId,
        undefined,
        c.req.header("x-forwarded-for") ?? c.req.header("x-real-ip"),
      );

      return c.json(ok({ deleted: true }));
    } catch (error) {
      const message = (error as Error).message;
      if (message === "User not found") {
        return c.json(err(message), 404);
      }
      return c.json(err(message), 400);
    }
  },
);

// POST /admin/users/:id/reset-password - Reset user password (super_admin only)
adminRoutes.post(
  "/users/:id/reset-password",
  adminGuard("owner"),
  zValidator("json", resetPasswordSchema),
  async (c) => {
    const auth = c.get("auth");
    const userId = c.req.param("id");
    const { newPassword } = c.req.valid("json");

    try {
      await adminService.resetUserPassword(userId, newPassword);

      await adminService.logAuditEvent(
        auth.profileId,
        "user.reset_password",
        "profile",
        userId,
        undefined,
        c.req.header("x-forwarded-for") ?? c.req.header("x-real-ip"),
      );

      return c.json(ok({ reset: true }));
    } catch (error) {
      const message = (error as Error).message;
      if (message === "User not found") {
        return c.json(err(message), 404);
      }
      return c.json(err(message), 400);
    }
  },
);

// PATCH /admin/users/:id/role - Change user role (super_admin only)
adminRoutes.patch(
  "/users/:id/role",
  adminGuard("owner"),
  zValidator("json", changeRoleSchema),
  async (c) => {
    const auth = c.get("auth");
    const userId = c.req.param("id");
    const { role } = c.req.valid("json");

    try {
      const user = await adminService.changeUserRole(userId, role, auth.profileId);

      await adminService.logAuditEvent(
        auth.profileId,
        "user.change_role",
        "profile",
        userId,
        { newRole: role },
        c.req.header("x-forwarded-for") ?? c.req.header("x-real-ip"),
      );

      return c.json(ok(user));
    } catch (error) {
      const message = (error as Error).message;
      if (message === "User not found") {
        return c.json(err(message), 404);
      }
      return c.json(err(message), 400);
    }
  },
);

// POST /admin/users/:id/tasks - Assign task to user
adminRoutes.post(
  "/users/:id/tasks",
  zValidator("json", assignTaskSchema),
  async (c) => {
    const auth = c.get("auth");
    const userId = c.req.param("id");
    const input = c.req.valid("json");

    try {
      const task = await adminService.assignTaskToUser(userId, input);

      await adminService.logAuditEvent(
        auth.profileId,
        "user.assign_task",
        "task",
        task.id,
        { targetUserId: userId, title: input.title },
        c.req.header("x-forwarded-for") ?? c.req.header("x-real-ip"),
      );

      return c.json(ok(task), 201);
    } catch (error) {
      const message = (error as Error).message;
      if (message === "User not found") {
        return c.json(err(message), 404);
      }
      return c.json(err(message), 400);
    }
  },
);

// GET /admin/users/:id/tasks - Get user tasks (paginated)
adminRoutes.get(
  "/users/:id/tasks",
  zValidator("query", userTasksQuerySchema),
  async (c) => {
    const userId = c.req.param("id");
    const query = c.req.valid("query");
    const { items, total } = await adminService.getUserTasks(
      userId,
      query.page,
      query.limit,
    );
    return c.json(paginated(items, total, query.page, query.limit));
  },
);

// GET /admin/users/:id/stats - Get user task statistics
adminRoutes.get("/users/:id/stats", async (c) => {
  const userId = c.req.param("id");
  const stats = await adminService.getUserStats(userId);
  return c.json(ok(stats));
});

// ── Content ───────────────────────────────────────────────────────────

// GET /admin/content - List content (paginated)
adminRoutes.get(
  "/content",
  zValidator("query", contentListQuerySchema),
  async (c) => {
    const query = c.req.valid("query");
    const { items, total } = await adminService.listContent(query);
    return c.json(paginated(items, total, query.page, query.limit));
  },
);

// POST /admin/content - Create content
adminRoutes.post(
  "/content",
  zValidator("json", createContentSchema),
  async (c) => {
    const auth = c.get("auth");
    const input = c.req.valid("json");
    const content = await adminService.createContent(input);

    await adminService.logAuditEvent(
      auth.profileId,
      "content.create",
      "daily_content",
      content.id,
      { category: input.category },
      c.req.header("x-forwarded-for") ?? c.req.header("x-real-ip"),
    );

    return c.json(ok(content), 201);
  },
);

// PATCH /admin/content/:id - Update content
adminRoutes.patch(
  "/content/:id",
  zValidator("json", updateContentSchema),
  async (c) => {
    const auth = c.get("auth");
    const contentId = c.req.param("id");
    const input = c.req.valid("json");
    const content = await adminService.updateContent(contentId, input);

    if (!content) {
      return c.json(err("Content not found"), 404);
    }

    await adminService.logAuditEvent(
      auth.profileId,
      "content.update",
      "daily_content",
      contentId,
      input,
      c.req.header("x-forwarded-for") ?? c.req.header("x-real-ip"),
    );

    return c.json(ok(content));
  },
);

// DELETE /admin/content/:id - Delete content
adminRoutes.delete("/content/:id", async (c) => {
  const auth = c.get("auth");
  const contentId = c.req.param("id");
  const deleted = await adminService.deleteContent(contentId);

  if (!deleted) {
    return c.json(err("Content not found"), 404);
  }

  await adminService.logAuditEvent(
    auth.profileId,
    "content.delete",
    "daily_content",
    contentId,
    undefined,
    c.req.header("x-forwarded-for") ?? c.req.header("x-real-ip"),
  );

  return c.json(ok({ deleted: true }));
});

// POST /admin/content/bulk-import - Bulk import content
adminRoutes.post(
  "/content/bulk-import",
  zValidator("json", bulkImportContentSchema),
  async (c) => {
    const auth = c.get("auth");
    const input = c.req.valid("json");
    const items = await adminService.bulkImportContent(input);

    await adminService.logAuditEvent(
      auth.profileId,
      "content.bulk_import",
      "daily_content",
      undefined,
      { importedCount: items.length, categories: [...new Set(input.items.map((i) => i.category))] },
      c.req.header("x-forwarded-for") ?? c.req.header("x-real-ip"),
    );

    return c.json(ok({ imported: items.length }), 201);
  },
);

// ── Analytics ─────────────────────────────────────────────────────────

// GET /admin/analytics/overview - DAU/MAU/subscriptions overview
adminRoutes.get("/analytics/overview", async (c) => {
  const overview = await adminService.getAnalyticsOverview();
  return c.json(ok(overview));
});

// GET /admin/analytics/signup-trend - Signups over time
adminRoutes.get(
  "/analytics/signup-trend",
  zValidator("query", trendQuerySchema),
  async (c) => {
    const { days } = c.req.valid("query");
    const data = await adminService.getSignupTrend(days);
    return c.json(ok(data));
  },
);

// GET /admin/analytics/dau-trend - DAU over time
adminRoutes.get(
  "/analytics/dau-trend",
  zValidator("query", trendQuerySchema),
  async (c) => {
    const { days } = c.req.valid("query");
    const data = await adminService.getDauTrend(days);
    return c.json(ok(data));
  },
);

// GET /admin/analytics/plan-distribution - Users by plan
adminRoutes.get("/analytics/plan-distribution", async (c) => {
  const data = await adminService.getPlanDistribution();
  return c.json(ok(data));
});

// GET /admin/analytics/task-activity - Tasks created/completed over time
adminRoutes.get(
  "/analytics/task-activity",
  zValidator("query", trendQuerySchema),
  async (c) => {
    const { days } = c.req.valid("query");
    const data = await adminService.getTaskActivity(days);
    return c.json(ok(data));
  },
);

// GET /admin/analytics/revenue-trend - Revenue over time
adminRoutes.get(
  "/analytics/revenue-trend",
  zValidator("query", trendQuerySchema),
  async (c) => {
    const { days } = c.req.valid("query");
    const data = await adminService.getRevenueTrend(days);
    return c.json(ok(data));
  },
);

// GET /admin/analytics/notification-stats - Notification delivery stats by channel
adminRoutes.get("/analytics/notification-stats", async (c) => {
  const data = await adminService.getNotificationStats();
  return c.json(ok(data));
});

// ── Feature Flags ─────────────────────────────────────────────────────

// GET /admin/feature-flags - List all
adminRoutes.get("/feature-flags", async (c) => {
  const flags = await adminService.listFeatureFlags();
  return c.json(ok(flags));
});

// POST /admin/feature-flags - Create
adminRoutes.post(
  "/feature-flags",
  zValidator("json", createFeatureFlagSchema),
  async (c) => {
    const auth = c.get("auth");
    const input = c.req.valid("json");
    const flag = await adminService.createFeatureFlag(input);

    await adminService.logAuditEvent(
      auth.profileId,
      "feature_flag.create",
      "feature_flag",
      flag.id,
      { key: input.key, status: input.status },
      c.req.header("x-forwarded-for") ?? c.req.header("x-real-ip"),
    );

    return c.json(ok(flag), 201);
  },
);

// PATCH /admin/feature-flags/:id - Update
adminRoutes.patch(
  "/feature-flags/:id",
  zValidator("json", updateFeatureFlagSchema),
  async (c) => {
    const auth = c.get("auth");
    const id = c.req.param("id");
    const input = c.req.valid("json");
    const flag = await adminService.updateFeatureFlag(id, input);

    if (!flag) {
      return c.json(err("Feature flag not found"), 404);
    }

    await adminService.logAuditEvent(
      auth.profileId,
      "feature_flag.update",
      "feature_flag",
      id,
      input,
      c.req.header("x-forwarded-for") ?? c.req.header("x-real-ip"),
    );

    return c.json(ok(flag));
  },
);

// DELETE /admin/feature-flags/:id - Delete
adminRoutes.delete("/feature-flags/:id", async (c) => {
  const auth = c.get("auth");
  const id = c.req.param("id");
  const deleted = await adminService.deleteFeatureFlag(id);

  if (!deleted) {
    return c.json(err("Feature flag not found"), 404);
  }

  await adminService.logAuditEvent(
    auth.profileId,
    "feature_flag.delete",
    "feature_flag",
    id,
    undefined,
    c.req.header("x-forwarded-for") ?? c.req.header("x-real-ip"),
  );

  return c.json(ok({ deleted: true }));
});

// ── Audit Log ─────────────────────────────────────────────────────────

// GET /admin/audit-log - Audit log (paginated, filterable)
adminRoutes.get(
  "/audit-log",
  zValidator("query", auditLogQuerySchema),
  async (c) => {
    const query = c.req.valid("query");
    const { items, total } = await adminService.getAuditLog(query);
    return c.json(paginated(items, total, query.page, query.limit));
  },
);

// ── Broadcast ─────────────────────────────────────────────────────────

// POST /admin/broadcast - Send broadcast notification
adminRoutes.post(
  "/broadcast",
  zValidator("json", broadcastSchema),
  async (c) => {
    const auth = c.get("auth");
    const input = c.req.valid("json");
    const result = await adminService.sendBroadcast(input);

    await adminService.logAuditEvent(
      auth.profileId,
      "broadcast.send",
      "notification",
      undefined,
      { title: input.title, targetPlan: input.targetPlan },
    );

    return c.json(ok(result), 201);
  },
);

// ── Notification Admin ───────────────────────────────────────────────

// GET /admin/notifications/channel-health - Channel delivery stats
adminRoutes.get("/notifications/channel-health", async (c) => {
  const data = await adminService.getNotificationStats();
  return c.json(ok(data));
});

// GET /admin/notifications/queue-status - Queue status summary
adminRoutes.get("/notifications/queue-status", async (c) => {
  const data = await adminService.getNotificationQueueStatus();
  return c.json(ok(data));
});

// GET /admin/notifications/failed - List failed notifications (paginated)
adminRoutes.get(
  "/notifications/failed",
  zValidator("query", failedNotificationsQuerySchema),
  async (c) => {
    const query = c.req.valid("query");
    const { items, total } = await adminService.getFailedNotifications(
      query.page,
      query.limit,
    );
    return c.json(paginated(items, total, query.page, query.limit));
  },
);

// POST /admin/notifications/:id/retry - Retry a single failed notification
adminRoutes.post("/notifications/:id/retry", async (c) => {
  const auth = c.get("auth");
  const attemptId = c.req.param("id");
  const result = await adminService.retryNotification(attemptId);

  if (!result) {
    return c.json(err("Notification not found or not in failed state"), 404);
  }

  await adminService.logAuditEvent(
    auth.profileId,
    "notification.retry",
    "delivery_attempt",
    attemptId,
    undefined,
    c.req.header("x-forwarded-for") ?? c.req.header("x-real-ip"),
  );

  return c.json(ok(result));
});

// POST /admin/notifications/retry-all - Retry all failed notifications
adminRoutes.post("/notifications/retry-all", async (c) => {
  const auth = c.get("auth");
  const count = await adminService.retryAllNotifications();

  await adminService.logAuditEvent(
    auth.profileId,
    "notification.retry_all",
    "delivery_attempt",
    undefined,
    { retriedCount: count },
    c.req.header("x-forwarded-for") ?? c.req.header("x-real-ip"),
  );

  return c.json(ok({ retriedCount: count }));
});

// ── Billing Admin ────────────────────────────────────────────────────

// GET /admin/billing/subscriptions - List all subscriptions (paginated)
adminRoutes.get(
  "/billing/subscriptions",
  zValidator("query", subscriptionListQuerySchema),
  async (c) => {
    const query = c.req.valid("query");
    const { items, total } = await adminService.listSubscriptions(query);
    return c.json(paginated(items, total, query.page, query.limit));
  },
);

// GET /admin/billing/stats - MRR, subscribers, churn
adminRoutes.get("/billing/stats", async (c) => {
  const stats = await adminService.getBillingStats();
  return c.json(ok(stats));
});

// GET /admin/billing/coupons - List all coupons
adminRoutes.get("/billing/coupons", async (c) => {
  const data = await adminService.listCoupons();
  return c.json(ok(data));
});

// POST /admin/billing/coupons - Create coupon
adminRoutes.post(
  "/billing/coupons",
  adminGuard("owner"),
  zValidator("json", createCouponSchema),
  async (c) => {
    const auth = c.get("auth");
    const input = c.req.valid("json");
    const coupon = await adminService.createCoupon(input);

    await adminService.logAuditEvent(
      auth.profileId,
      "coupon.create",
      "coupon",
      coupon.id,
      { code: input.code },
      c.req.header("x-forwarded-for") ?? c.req.header("x-real-ip"),
    );

    return c.json(ok(coupon), 201);
  },
);

// PATCH /admin/billing/coupons/:id - Update coupon
adminRoutes.patch(
  "/billing/coupons/:id",
  adminGuard("owner"),
  zValidator("json", updateCouponSchema),
  async (c) => {
    const id = c.req.param("id");
    const input = c.req.valid("json");
    const coupon = await adminService.updateCoupon(id, input);

    if (!coupon) {
      return c.json(err("Coupon not found"), 404);
    }

    return c.json(ok(coupon));
  },
);

// DELETE /admin/billing/coupons/:id - Delete coupon
adminRoutes.delete(
  "/billing/coupons/:id",
  adminGuard("owner"),
  async (c) => {
    const auth = c.get("auth");
    const id = c.req.param("id");
    const deleted = await adminService.deleteCoupon(id);

    if (!deleted) {
      return c.json(err("Coupon not found"), 404);
    }

    await adminService.logAuditEvent(
      auth.profileId,
      "coupon.delete",
      "coupon",
      id,
      undefined,
      c.req.header("x-forwarded-for") ?? c.req.header("x-real-ip"),
    );

    return c.json(ok({ deleted: true }));
  },
);

// ── Support Admin ────────────────────────────────────────────────────

// GET /admin/support/account-health/:userId - Account health check
adminRoutes.get("/support/account-health/:userId", async (c) => {
  const userId = c.req.param("userId");
  const health = await adminService.getAccountHealth(userId);

  if (!health) {
    return c.json(err("User not found"), 404);
  }

  return c.json(ok(health));
});

// ── User Activity ────────────────────────────────────────────────────

// GET /admin/users/:id/activity - Audit log filtered by user
adminRoutes.get(
  "/users/:id/activity",
  zValidator("query", userActivityQuerySchema),
  async (c) => {
    const userId = c.req.param("id");
    const query = c.req.valid("query");
    const { items, total } = await adminService.getUserActivity(
      userId,
      query.page,
      query.limit,
    );
    return c.json(paginated(items, total, query.page, query.limit));
  },
);

// ── Compliance ───────────────────────────────────────────────────────

// GET /admin/compliance/summary - Compliance overview
adminRoutes.get("/compliance/summary", async (c) => {
  const data = await adminService.getComplianceSummary();
  return c.json(ok(data));
});

// ── Login Events (Audit Trail) ──────────────────────────────────────

// GET /admin/login-events - Login events (paginated, filterable)
adminRoutes.get(
  "/login-events",
  zValidator("query", loginEventsQuerySchema),
  async (c) => {
    const query = c.req.valid("query");
    const { items, total } = await loginAuditService.getAllLoginEvents({
      page: query.page,
      limit: query.limit,
      userId: query.userId,
      eventType: query.eventType,
      dateFrom: query.dateFrom,
      dateTo: query.dateTo,
    });
    return c.json(paginated(items, total, query.page, query.limit));
  },
);
