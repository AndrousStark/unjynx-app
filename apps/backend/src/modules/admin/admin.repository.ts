import { eq, and, desc, asc, count, ilike, or, gte, lte, sql, sum, isNull, isNotNull, ne, lt } from "drizzle-orm";
import { db } from "../../db/index.js";
import {
  profiles,
  dailyContent,
  featureFlags,
  auditLog,
  subscriptions,
  invoices,
  coupons,
  couponRedemptions,
  tasks,
  notifications,
  deliveryAttempts,
  type Profile,
  type NewProfile,
  type DailyContentItem,
  type NewDailyContentItem,
  type FeatureFlag,
  type NewFeatureFlag,
  type AuditLogEntry,
  type NewAuditLogEntry,
  type Task,
  type NewTask,
  type Coupon,
  type NewCoupon,
  type Subscription,
  type DeliveryAttempt,
} from "../../db/schema/index.js";

// ── Users ─────────────────────────────────────────────────────────────

export type ProfileWithPlan = Profile & { plan: string };

export async function findUsers(
  search: string | undefined,
  limit: number,
  offset: number,
  role?: string,
  sortBy?: string,
  sortOrder?: "asc" | "desc",
  status?: string,
): Promise<{ items: ProfileWithPlan[]; total: number }> {
  const conditionList = [];

  if (search) {
    conditionList.push(
      or(
        ilike(profiles.name, `%${search}%`),
        ilike(profiles.email, `%${search}%`),
      )!,
    );
  }

  if (role) {
    conditionList.push(
      eq(profiles.adminRole, role as (typeof profiles.adminRole.enumValues)[number]),
    );
  }

  if (status === "banned") {
    conditionList.push(eq(profiles.isBanned, true));
  } else if (status === "active") {
    conditionList.push(eq(profiles.isBanned, false));
  }

  const where = conditionList.length > 0 ? and(...conditionList) : undefined;

  // Determine sort column
  const sortColumnMap: Record<string, typeof profiles.createdAt> = {
    createdAt: profiles.createdAt,
    updatedAt: profiles.updatedAt,
    name: profiles.name as unknown as typeof profiles.createdAt,
    email: profiles.email as unknown as typeof profiles.createdAt,
  };
  const sortCol = (sortBy && sortColumnMap[sortBy]) ?? profiles.createdAt;
  const orderFn = sortOrder === "asc" ? asc : desc;

  const [rows, [{ total }]] = await Promise.all([
    db
      .select({
        profile: profiles,
        plan: subscriptions.plan,
      })
      .from(profiles)
      .leftJoin(
        subscriptions,
        and(
          eq(subscriptions.userId, profiles.id),
          eq(subscriptions.status, "active"),
        ),
      )
      .where(where)
      .orderBy(orderFn(sortCol))
      .limit(limit)
      .offset(offset),
    db.select({ total: count() }).from(profiles).where(where),
  ]);

  const items: ProfileWithPlan[] = rows.map((row) => ({
    ...row.profile,
    plan: row.plan ?? "free",
  }));

  return { items, total };
}

export async function findUserById(
  userId: string,
): Promise<ProfileWithPlan | undefined> {
  const [row] = await db
    .select({
      profile: profiles,
      plan: subscriptions.plan,
    })
    .from(profiles)
    .leftJoin(
      subscriptions,
      and(
        eq(subscriptions.userId, profiles.id),
        eq(subscriptions.status, "active"),
      ),
    )
    .where(eq(profiles.id, userId))
    .limit(1);

  if (!row) return undefined;

  return { ...row.profile, plan: row.plan ?? "free" };
}

export async function updateUser(
  userId: string,
  data: Partial<Profile>,
): Promise<Profile | undefined> {
  const [updated] = await db
    .update(profiles)
    .set({ ...data, updatedAt: new Date() })
    .where(eq(profiles.id, userId))
    .returning();

  return updated;
}

export async function createProfile(
  data: NewProfile,
): Promise<Profile> {
  const [created] = await db
    .insert(profiles)
    .values(data)
    .returning();

  return created;
}

export async function deleteProfile(
  userId: string,
): Promise<boolean> {
  const result = await db
    .delete(profiles)
    .where(eq(profiles.id, userId))
    .returning({ id: profiles.id });

  return result.length > 0;
}

export async function findUserByLogtoId(
  logtoId: string,
): Promise<Profile | undefined> {
  const [profile] = await db
    .select()
    .from(profiles)
    .where(eq(profiles.logtoId, logtoId))
    .limit(1);

  return profile;
}

// ── User Subscription ────────────────────────────────────────────────

export async function upsertUserSubscription(
  userId: string,
  plan: "free" | "pro" | "team" | "enterprise",
): Promise<Subscription> {
  // Find existing active subscription
  const [existing] = await db
    .select()
    .from(subscriptions)
    .where(
      and(
        eq(subscriptions.userId, userId),
        eq(subscriptions.status, "active"),
      ),
    )
    .limit(1);

  if (existing) {
    // Update existing subscription's plan
    const [updated] = await db
      .update(subscriptions)
      .set({ plan, updatedAt: new Date() })
      .where(eq(subscriptions.id, existing.id))
      .returning();
    return updated;
  }

  // Create new subscription
  const [created] = await db
    .insert(subscriptions)
    .values({
      userId,
      plan,
      status: "active",
    })
    .returning();
  return created;
}

// ── User Tasks ───────────────────────────────────────────────────────

export async function getUserTasks(
  userId: string,
  limit: number,
  offset: number,
): Promise<{ items: Task[]; total: number }> {
  const condition = eq(tasks.userId, userId);

  const [items, [{ total }]] = await Promise.all([
    db
      .select()
      .from(tasks)
      .where(condition)
      .orderBy(desc(tasks.createdAt))
      .limit(limit)
      .offset(offset),
    db.select({ total: count() }).from(tasks).where(condition),
  ]);

  return { items, total };
}

export async function createTask(
  data: NewTask,
): Promise<Task> {
  const [created] = await db
    .insert(tasks)
    .values(data)
    .returning();

  return created;
}

export interface UserStats {
  readonly totalTasks: number;
  readonly completedTasks: number;
  readonly pendingTasks: number;
}

export async function getUserStats(
  userId: string,
): Promise<UserStats> {
  const condition = eq(tasks.userId, userId);

  const [[{ totalTasks }], [{ completedTasks }], [{ pendingTasks }]] =
    await Promise.all([
      db.select({ totalTasks: count() }).from(tasks).where(condition),
      db
        .select({ completedTasks: count() })
        .from(tasks)
        .where(and(condition, eq(tasks.status, "completed"))),
      db
        .select({ pendingTasks: count() })
        .from(tasks)
        .where(and(condition, eq(tasks.status, "pending"))),
    ]);

  return { totalTasks, completedTasks, pendingTasks };
}

// ── Content ───────────────────────────────────────────────────────────

export async function findContent(
  category: string | undefined,
  limit: number,
  offset: number,
): Promise<{ items: DailyContentItem[]; total: number }> {
  const conditions = category
    ? eq(dailyContent.category, category as (typeof dailyContent.category.enumValues)[number])
    : undefined;

  const [items, [{ total }]] = await Promise.all([
    db
      .select()
      .from(dailyContent)
      .where(conditions)
      .orderBy(desc(dailyContent.createdAt))
      .limit(limit)
      .offset(offset),
    db.select({ total: count() }).from(dailyContent).where(conditions),
  ]);

  return { items, total };
}

export async function insertContent(
  data: NewDailyContentItem,
): Promise<DailyContentItem> {
  const [created] = await db
    .insert(dailyContent)
    .values(data)
    .returning();

  return created;
}

export async function updateContent(
  contentId: string,
  data: Partial<DailyContentItem>,
): Promise<DailyContentItem | undefined> {
  const [updated] = await db
    .update(dailyContent)
    .set(data)
    .where(eq(dailyContent.id, contentId))
    .returning();

  return updated;
}

export async function deleteContent(
  contentId: string,
): Promise<boolean> {
  const result = await db
    .delete(dailyContent)
    .where(eq(dailyContent.id, contentId))
    .returning({ id: dailyContent.id });

  return result.length > 0;
}

export async function bulkInsertContent(
  data: NewDailyContentItem[],
): Promise<DailyContentItem[]> {
  if (data.length === 0) return [];
  return db.insert(dailyContent).values(data).returning();
}

// ── Feature Flags ─────────────────────────────────────────────────────

export async function findFeatureFlags(): Promise<FeatureFlag[]> {
  return db
    .select()
    .from(featureFlags)
    .orderBy(featureFlags.key);
}

export async function findFeatureFlagById(
  id: string,
): Promise<FeatureFlag | undefined> {
  const [flag] = await db
    .select()
    .from(featureFlags)
    .where(eq(featureFlags.id, id))
    .limit(1);

  return flag;
}

export async function insertFeatureFlag(
  data: NewFeatureFlag,
): Promise<FeatureFlag> {
  const [created] = await db
    .insert(featureFlags)
    .values(data)
    .returning();

  return created;
}

export async function updateFeatureFlag(
  id: string,
  data: Partial<FeatureFlag>,
): Promise<FeatureFlag | undefined> {
  const [updated] = await db
    .update(featureFlags)
    .set({ ...data, updatedAt: new Date() })
    .where(eq(featureFlags.id, id))
    .returning();

  return updated;
}

export async function deleteFeatureFlag(
  id: string,
): Promise<boolean> {
  const result = await db
    .delete(featureFlags)
    .where(eq(featureFlags.id, id))
    .returning({ id: featureFlags.id });

  return result.length > 0;
}

// ── Audit Log ─────────────────────────────────────────────────────────

export async function insertAuditEntry(
  data: NewAuditLogEntry,
): Promise<AuditLogEntry> {
  const [created] = await db
    .insert(auditLog)
    .values(data)
    .returning();

  return created;
}

export async function findAuditLog(
  filters: { action?: string; userId?: string },
  limit: number,
  offset: number,
): Promise<{ items: AuditLogEntry[]; total: number }> {
  const conditions = [];

  if (filters.action) {
    conditions.push(eq(auditLog.action, filters.action));
  }
  if (filters.userId) {
    conditions.push(eq(auditLog.userId, filters.userId));
  }

  const where = conditions.length > 0 ? and(...conditions) : undefined;

  const [items, [{ total }]] = await Promise.all([
    db
      .select()
      .from(auditLog)
      .where(where)
      .orderBy(desc(auditLog.createdAt))
      .limit(limit)
      .offset(offset),
    db.select({ total: count() }).from(auditLog).where(where),
  ]);

  return { items, total };
}

// ── Analytics ─────────────────────────────────────────────────────────

export interface AnalyticsOverview {
  readonly totalUsers: number;
  readonly activeUsersToday: number;
  readonly activeUsersMonth: number;
  readonly totalSubscriptions: number;
}

export async function getAnalyticsOverview(): Promise<AnalyticsOverview> {
  const now = new Date();
  const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

  const [[{ totalUsers }], [{ activeToday }], [{ activeMonth }], [{ totalSubs }]] =
    await Promise.all([
      db.select({ totalUsers: count() }).from(profiles),
      db
        .select({ activeToday: count() })
        .from(profiles)
        .where(gte(profiles.updatedAt, startOfDay)),
      db
        .select({ activeMonth: count() })
        .from(profiles)
        .where(gte(profiles.updatedAt, startOfMonth)),
      db
        .select({ totalSubs: count() })
        .from(subscriptions)
        .where(eq(subscriptions.status, "active")),
    ]);

  return {
    totalUsers,
    activeUsersToday: activeToday,
    activeUsersMonth: activeMonth,
    totalSubscriptions: totalSubs,
  };
}

// ── Analytics: Signup Trend ──────────────────────────────────────────

export interface TrendPoint {
  readonly date: string;
  readonly count: number;
}

export async function getSignupTrend(days: number): Promise<TrendPoint[]> {
  const since = new Date();
  since.setDate(since.getDate() - days);

  const rows = await db
    .select({
      date: sql<string>`to_char(${profiles.createdAt}::date, 'YYYY-MM-DD')`,
      count: count(),
    })
    .from(profiles)
    .where(gte(profiles.createdAt, since))
    .groupBy(sql`${profiles.createdAt}::date`)
    .orderBy(asc(sql`${profiles.createdAt}::date`));

  return rows.map((r) => ({ date: r.date, count: r.count }));
}

// ── Analytics: DAU Trend ─────────────────────────────────────────────

export async function getDauTrend(days: number): Promise<TrendPoint[]> {
  const since = new Date();
  since.setDate(since.getDate() - days);

  const rows = await db
    .select({
      date: sql<string>`to_char(${profiles.updatedAt}::date, 'YYYY-MM-DD')`,
      count: count(),
    })
    .from(profiles)
    .where(gte(profiles.updatedAt, since))
    .groupBy(sql`${profiles.updatedAt}::date`)
    .orderBy(asc(sql`${profiles.updatedAt}::date`));

  return rows.map((r) => ({ date: r.date, count: r.count }));
}

// ── Analytics: Plan Distribution ─────────────────────────────────────

export interface PlanDistribution {
  readonly plan: string;
  readonly count: number;
}

export async function getPlanDistribution(): Promise<PlanDistribution[]> {
  const rows = await db
    .select({
      plan: subscriptions.plan,
      count: count(),
    })
    .from(subscriptions)
    .where(eq(subscriptions.status, "active"))
    .groupBy(subscriptions.plan);

  return rows.map((r) => ({ plan: r.plan, count: r.count }));
}

// ── Analytics: Task Activity ─────────────────────────────────────────

export interface TaskActivityPoint {
  readonly date: string;
  readonly created: number;
  readonly completed: number;
}

export async function getTaskActivity(days: number): Promise<TaskActivityPoint[]> {
  const since = new Date();
  since.setDate(since.getDate() - days);

  const [createdRows, completedRows] = await Promise.all([
    db
      .select({
        date: sql<string>`to_char(${tasks.createdAt}::date, 'YYYY-MM-DD')`,
        count: count(),
      })
      .from(tasks)
      .where(gte(tasks.createdAt, since))
      .groupBy(sql`${tasks.createdAt}::date`)
      .orderBy(asc(sql`${tasks.createdAt}::date`)),
    db
      .select({
        date: sql<string>`to_char(${tasks.completedAt}::date, 'YYYY-MM-DD')`,
        count: count(),
      })
      .from(tasks)
      .where(and(isNotNull(tasks.completedAt), gte(tasks.completedAt, since)))
      .groupBy(sql`${tasks.completedAt}::date`)
      .orderBy(asc(sql`${tasks.completedAt}::date`)),
  ]);

  const dateMap = new Map<string, { created: number; completed: number }>();
  for (const r of createdRows) {
    dateMap.set(r.date, { created: r.count, completed: 0 });
  }
  for (const r of completedRows) {
    const existing = dateMap.get(r.date) ?? { created: 0, completed: 0 };
    dateMap.set(r.date, { ...existing, completed: r.count });
  }

  return Array.from(dateMap.entries())
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([date, vals]) => ({ date, ...vals }));
}

// ── Analytics: Revenue Trend ─────────────────────────────────────────

export interface RevenuePoint {
  readonly date: string;
  readonly amount: number;
  readonly currency: string;
}

export async function getRevenueTrend(days: number): Promise<RevenuePoint[]> {
  const since = new Date();
  since.setDate(since.getDate() - days);

  const rows = await db
    .select({
      date: sql<string>`to_char(${invoices.paidAt}::date, 'YYYY-MM-DD')`,
      amount: sql<number>`coalesce(sum(${invoices.amount}), 0)`,
      currency: invoices.currency,
    })
    .from(invoices)
    .where(
      and(
        eq(invoices.status, "paid"),
        isNotNull(invoices.paidAt),
        gte(invoices.paidAt, since),
      ),
    )
    .groupBy(sql`${invoices.paidAt}::date`, invoices.currency)
    .orderBy(asc(sql`${invoices.paidAt}::date`));

  return rows.map((r) => ({ date: r.date, amount: Number(r.amount), currency: r.currency }));
}

// ── Analytics: Notification Stats ────────────────────────────────────

export interface NotificationChannelStats {
  readonly channel: string;
  readonly total: number;
  readonly sent: number;
  readonly delivered: number;
  readonly failed: number;
  readonly pending: number;
}

export async function getNotificationStats(): Promise<NotificationChannelStats[]> {
  const rows = await db
    .select({
      channel: deliveryAttempts.channel,
      status: deliveryAttempts.status,
      count: count(),
    })
    .from(deliveryAttempts)
    .groupBy(deliveryAttempts.channel, deliveryAttempts.status);

  const channelMap = new Map<string, { total: number; sent: number; delivered: number; failed: number; pending: number }>();

  for (const r of rows) {
    const existing = channelMap.get(r.channel) ?? { total: 0, sent: 0, delivered: 0, failed: 0, pending: 0 };
    existing.total += r.count;
    if (r.status === "sent") existing.sent += r.count;
    else if (r.status === "delivered" || r.status === "read") existing.delivered += r.count;
    else if (r.status === "failed") existing.failed += r.count;
    else existing.pending += r.count;
    channelMap.set(r.channel, existing);
  }

  return Array.from(channelMap.entries()).map(([channel, stats]) => ({ channel, ...stats }));
}

// ── Notification Admin: Queue Status ─────────────────────────────────

export interface QueueStatus {
  readonly pending: number;
  readonly queued: number;
  readonly sent: number;
  readonly failed: number;
  readonly total: number;
}

export async function getNotificationQueueStatus(): Promise<QueueStatus> {
  const rows = await db
    .select({
      status: deliveryAttempts.status,
      count: count(),
    })
    .from(deliveryAttempts)
    .groupBy(deliveryAttempts.status);

  const result = { pending: 0, queued: 0, sent: 0, failed: 0, total: 0 };
  for (const r of rows) {
    result.total += r.count;
    if (r.status === "pending") result.pending += r.count;
    else if (r.status === "queued") result.queued += r.count;
    else if (r.status === "sent" || r.status === "delivered" || r.status === "read") result.sent += r.count;
    else if (r.status === "failed") result.failed += r.count;
  }
  return result;
}

// ── Notification Admin: Failed Notifications ─────────────────────────

export async function findFailedNotifications(
  limit: number,
  offset: number,
): Promise<{ items: DeliveryAttempt[]; total: number }> {
  const condition = eq(deliveryAttempts.status, "failed");

  const [items, [{ total }]] = await Promise.all([
    db
      .select()
      .from(deliveryAttempts)
      .where(condition)
      .orderBy(desc(deliveryAttempts.failedAt))
      .limit(limit)
      .offset(offset),
    db.select({ total: count() }).from(deliveryAttempts).where(condition),
  ]);

  return { items, total };
}

// ── Notification Admin: Retry Failed ─────────────────────────────────

export async function resetDeliveryAttempt(
  attemptId: string,
): Promise<DeliveryAttempt | undefined> {
  const [updated] = await db
    .update(deliveryAttempts)
    .set({
      status: "pending",
      failedAt: null,
      errorType: null,
      errorMessage: null,
      errorCode: null,
      updatedAt: new Date(),
    })
    .where(and(eq(deliveryAttempts.id, attemptId), eq(deliveryAttempts.status, "failed")))
    .returning();

  return updated;
}

export async function resetAllFailedAttempts(): Promise<number> {
  const result = await db
    .update(deliveryAttempts)
    .set({
      status: "pending",
      failedAt: null,
      errorType: null,
      errorMessage: null,
      errorCode: null,
      updatedAt: new Date(),
    })
    .where(eq(deliveryAttempts.status, "failed"))
    .returning({ id: deliveryAttempts.id });

  return result.length;
}

// ── Billing Admin: Subscriptions ─────────────────────────────────────

export async function findAllSubscriptions(
  limit: number,
  offset: number,
  plan?: string,
  status?: string,
): Promise<{ items: Subscription[]; total: number }> {
  const conditions = [];
  if (plan) {
    conditions.push(eq(subscriptions.plan, plan as (typeof subscriptions.plan.enumValues)[number]));
  }
  if (status) {
    conditions.push(eq(subscriptions.status, status as (typeof subscriptions.status.enumValues)[number]));
  }

  const where = conditions.length > 0 ? and(...conditions) : undefined;

  const [items, [{ total }]] = await Promise.all([
    db
      .select()
      .from(subscriptions)
      .where(where)
      .orderBy(desc(subscriptions.createdAt))
      .limit(limit)
      .offset(offset),
    db.select({ total: count() }).from(subscriptions).where(where),
  ]);

  return { items, total };
}

// ── Billing Admin: Stats ─────────────────────────────────────────────

export interface BillingStats {
  readonly totalSubscribers: number;
  readonly activeSubscribers: number;
  readonly mrr: number;
  readonly cancelledThisMonth: number;
}

export async function getBillingStats(): Promise<BillingStats> {
  const now = new Date();
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

  const [[{ totalSubs }], [{ activeSubs }], [{ cancelled }], revenueRows] =
    await Promise.all([
      db.select({ totalSubs: count() }).from(subscriptions),
      db
        .select({ activeSubs: count() })
        .from(subscriptions)
        .where(eq(subscriptions.status, "active")),
      db
        .select({ cancelled: count() })
        .from(subscriptions)
        .where(
          and(
            eq(subscriptions.status, "cancelled"),
            gte(subscriptions.cancelledAt, startOfMonth),
          ),
        ),
      db
        .select({ total: sql<number>`coalesce(sum(${invoices.amount}), 0)` })
        .from(invoices)
        .where(
          and(
            eq(invoices.status, "paid"),
            gte(invoices.paidAt, startOfMonth),
          ),
        ),
    ]);

  return {
    totalSubscribers: totalSubs,
    activeSubscribers: activeSubs,
    mrr: Number(revenueRows[0]?.total ?? 0),
    cancelledThisMonth: cancelled,
  };
}

// ── Billing Admin: Coupons ───────────────────────────────────────────

export async function findAllCoupons(): Promise<Coupon[]> {
  return db.select().from(coupons).orderBy(desc(coupons.createdAt));
}

export async function findCouponById(id: string): Promise<Coupon | undefined> {
  const [coupon] = await db
    .select()
    .from(coupons)
    .where(eq(coupons.id, id))
    .limit(1);
  return coupon;
}

export async function insertCoupon(data: NewCoupon): Promise<Coupon> {
  const [created] = await db.insert(coupons).values(data).returning();
  return created;
}

export async function updateCoupon(
  id: string,
  data: Partial<Coupon>,
): Promise<Coupon | undefined> {
  const [updated] = await db
    .update(coupons)
    .set(data)
    .where(eq(coupons.id, id))
    .returning();
  return updated;
}

export async function deleteCoupon(id: string): Promise<boolean> {
  const result = await db
    .delete(coupons)
    .where(eq(coupons.id, id))
    .returning({ id: coupons.id });
  return result.length > 0;
}

// ── Support Admin: Account Health ────────────────────────────────────

export interface AccountHealth {
  readonly userId: string;
  readonly email: string | null;
  readonly name: string | null;
  readonly createdAt: Date;
  readonly lastActive: Date;
  readonly totalTasks: number;
  readonly completedTasks: number;
  readonly subscriptionPlan: string | null;
  readonly subscriptionStatus: string | null;
  readonly totalNotifications: number;
  readonly failedNotifications: number;
}

export async function getAccountHealth(userId: string): Promise<AccountHealth | null> {
  const profile = await findUserById(userId);
  if (!profile) return null;

  const [
    [{ totalTasks }],
    [{ completedTasks }],
    sub,
    [{ totalNotif }],
    [{ failedNotif }],
  ] = await Promise.all([
    db.select({ totalTasks: count() }).from(tasks).where(eq(tasks.userId, userId)),
    db
      .select({ completedTasks: count() })
      .from(tasks)
      .where(and(eq(tasks.userId, userId), eq(tasks.status, "completed"))),
    db
      .select()
      .from(subscriptions)
      .where(eq(subscriptions.userId, userId))
      .limit(1),
    db
      .select({ totalNotif: count() })
      .from(notifications)
      .where(eq(notifications.userId, userId)),
    db
      .select({ failedNotif: count() })
      .from(deliveryAttempts)
      .innerJoin(notifications, eq(deliveryAttempts.notificationId, notifications.id))
      .where(
        and(
          eq(notifications.userId, userId),
          eq(deliveryAttempts.status, "failed"),
        ),
      ),
  ]);

  return {
    userId: profile.id,
    email: profile.email,
    name: profile.name,
    createdAt: profile.createdAt,
    lastActive: profile.updatedAt,
    totalTasks,
    completedTasks,
    subscriptionPlan: sub[0]?.plan ?? null,
    subscriptionStatus: sub[0]?.status ?? null,
    totalNotifications: totalNotif,
    failedNotifications: failedNotif,
  };
}

// ── User Activity (Audit log by entity) ──────────────────────────────

export async function findUserActivity(
  userId: string,
  limit: number,
  offset: number,
): Promise<{ items: AuditLogEntry[]; total: number }> {
  const condition = or(
    eq(auditLog.userId, userId),
    eq(auditLog.entityId, userId),
  )!;

  const [items, [{ total }]] = await Promise.all([
    db
      .select()
      .from(auditLog)
      .where(condition)
      .orderBy(desc(auditLog.createdAt))
      .limit(limit)
      .offset(offset),
    db.select({ total: count() }).from(auditLog).where(condition),
  ]);

  return { items, total };
}

// ── Compliance: GDPR/DPDP Summary ────────────────────────────────────

export interface ComplianceSummary {
  readonly totalUsers: number;
  readonly usersWithEmail: number;
  readonly usersWithoutEmail: number;
  readonly dataRetentionDays: number;
  readonly auditLogEntries: number;
  readonly oldestAuditEntry: string | null;
}

export async function getComplianceSummary(): Promise<ComplianceSummary> {
  const [[{ totalUsers }], [{ withEmail }], [{ auditCount }], oldestEntry] =
    await Promise.all([
      db.select({ totalUsers: count() }).from(profiles),
      db
        .select({ withEmail: count() })
        .from(profiles)
        .where(isNotNull(profiles.email)),
      db.select({ auditCount: count() }).from(auditLog),
      db
        .select({ createdAt: auditLog.createdAt })
        .from(auditLog)
        .orderBy(asc(auditLog.createdAt))
        .limit(1),
    ]);

  return {
    totalUsers,
    usersWithEmail: withEmail,
    usersWithoutEmail: totalUsers - withEmail,
    dataRetentionDays: 365,
    auditLogEntries: auditCount,
    oldestAuditEntry: oldestEntry[0]?.createdAt?.toISOString() ?? null,
  };
}
