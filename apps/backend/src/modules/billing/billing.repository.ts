import { eq, and, desc, count, sql } from "drizzle-orm";
import { db } from "../../db/index.js";
import {
  subscriptions,
  invoices,
  coupons,
  couponRedemptions,
  type Subscription,
  type NewSubscription,
  type Invoice,
  type NewInvoice,
  type Coupon,
  type CouponRedemption,
} from "../../db/schema/index.js";

// ── Subscriptions ─────────────────────────────────────────────────────

export async function findActiveSubscription(
  userId: string,
): Promise<Subscription | undefined> {
  const [sub] = await db
    .select()
    .from(subscriptions)
    .where(
      and(
        eq(subscriptions.userId, userId),
        eq(subscriptions.status, "active"),
      ),
    )
    .limit(1);

  return sub;
}

export async function findSubscriptionByUserId(
  userId: string,
): Promise<Subscription | undefined> {
  const [sub] = await db
    .select()
    .from(subscriptions)
    .where(eq(subscriptions.userId, userId))
    .orderBy(desc(subscriptions.createdAt))
    .limit(1);

  return sub;
}

export async function findSubscriptionByCustomerId(
  customerId: string,
): Promise<Subscription | undefined> {
  const [sub] = await db
    .select()
    .from(subscriptions)
    .where(eq(subscriptions.revenueCatCustomerId, customerId))
    .orderBy(desc(subscriptions.createdAt))
    .limit(1);

  return sub;
}

export async function upsertSubscription(
  data: NewSubscription,
): Promise<Subscription> {
  const [result] = await db
    .insert(subscriptions)
    .values(data)
    .onConflictDoNothing()
    .returning();

  if (result) return result;

  // If conflict, update existing
  const [updated] = await db
    .update(subscriptions)
    .set({
      plan: data.plan,
      status: data.status,
      revenueCatCustomerId: data.revenueCatCustomerId,
      revenueCatEntitlementId: data.revenueCatEntitlementId,
      currentPeriodStart: data.currentPeriodStart,
      currentPeriodEnd: data.currentPeriodEnd,
      cancelledAt: data.cancelledAt,
      updatedAt: new Date(),
    })
    .where(eq(subscriptions.userId, data.userId))
    .returning();

  return updated;
}

export async function updateSubscriptionStatus(
  userId: string,
  status: "active" | "past_due" | "cancelled" | "expired",
  extra?: Partial<Pick<Subscription, "cancelledAt" | "currentPeriodStart" | "currentPeriodEnd" | "plan">>,
): Promise<Subscription | undefined> {
  const [updated] = await db
    .update(subscriptions)
    .set({ status, ...extra, updatedAt: new Date() })
    .where(eq(subscriptions.userId, userId))
    .returning();

  return updated;
}

// ── Invoices ──────────────────────────────────────────────────────────

export async function insertInvoice(data: NewInvoice): Promise<Invoice> {
  const [created] = await db.insert(invoices).values(data).returning();
  return created;
}

export async function findInvoices(
  userId: string,
  limit: number,
  offset: number,
): Promise<{ items: Invoice[]; total: number }> {
  const where = eq(invoices.userId, userId);

  const [items, [{ total }]] = await Promise.all([
    db
      .select()
      .from(invoices)
      .where(where)
      .orderBy(desc(invoices.issuedAt))
      .limit(limit)
      .offset(offset),
    db.select({ total: count() }).from(invoices).where(where),
  ]);

  return { items, total };
}

// ── Coupons ───────────────────────────────────────────────────────────

export async function findCouponByCode(
  code: string,
): Promise<Coupon | undefined> {
  const [coupon] = await db
    .select()
    .from(coupons)
    .where(eq(coupons.code, code.toUpperCase()))
    .limit(1);

  return coupon;
}

export async function hasUserRedeemedCoupon(
  userId: string,
  couponId: string,
): Promise<boolean> {
  const [redemption] = await db
    .select({ id: couponRedemptions.id })
    .from(couponRedemptions)
    .where(
      and(
        eq(couponRedemptions.userId, userId),
        eq(couponRedemptions.couponId, couponId),
      ),
    )
    .limit(1);

  return !!redemption;
}

export async function redeemCoupon(
  userId: string,
  couponId: string,
): Promise<CouponRedemption> {
  // Increment usage count
  await db
    .update(coupons)
    .set({ usedCount: sql`${coupons.usedCount} + 1` })
    .where(eq(coupons.id, couponId));

  const [redemption] = await db
    .insert(couponRedemptions)
    .values({ couponId, userId })
    .returning();

  return redemption;
}
