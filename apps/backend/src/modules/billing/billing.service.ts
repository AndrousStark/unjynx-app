import type { Subscription, Invoice, Coupon } from "../../db/schema/index.js";
import type { WebhookEvent, PlansQuery } from "./billing.schema.js";
import * as billingRepo from "./billing.repository.js";
import * as adminRepo from "../admin/admin.repository.js";

// ── Regional Pricing ──────────────────────────────────────────────────

interface PlanDetails {
  readonly id: string;
  readonly name: string;
  readonly monthlyPrice: number;
  readonly annualPrice: number;
  readonly currency: string;
  readonly features: readonly string[];
}

const PLANS_USD: readonly PlanDetails[] = [
  {
    id: "free",
    name: "Free",
    monthlyPrice: 0,
    annualPrice: 0,
    currency: "USD",
    features: ["Basic tasks", "Push notifications", "5 projects"],
  },
  {
    id: "pro",
    name: "Pro",
    monthlyPrice: 699,
    annualPrice: 5988,
    currency: "USD",
    features: ["All channels", "Ghost mode", "AI insights", "Unlimited projects"],
  },
  {
    id: "team",
    name: "Team",
    monthlyPrice: 899,
    annualPrice: 8388,
    currency: "USD",
    features: ["Everything in Pro", "Team standups", "RBAC", "Admin panel"],
  },
  {
    id: "enterprise",
    name: "Enterprise",
    monthlyPrice: 0,
    annualPrice: 0,
    currency: "USD",
    features: ["Everything in Team", "SSO", "SLA", "Custom integrations"],
  },
] as const;

const PLANS_INR: readonly PlanDetails[] = [
  {
    id: "free",
    name: "Free",
    monthlyPrice: 0,
    annualPrice: 0,
    currency: "INR",
    features: ["Basic tasks", "Push notifications", "5 projects"],
  },
  {
    id: "pro",
    name: "Pro",
    monthlyPrice: 14900,
    annualPrice: 118800,
    currency: "INR",
    features: ["All channels", "Ghost mode", "AI insights", "Unlimited projects"],
  },
  {
    id: "team",
    name: "Team",
    monthlyPrice: 19900,
    annualPrice: 178800,
    currency: "INR",
    features: ["Everything in Pro", "Team standups", "RBAC", "Admin panel"],
  },
  {
    id: "enterprise",
    name: "Enterprise",
    monthlyPrice: 0,
    annualPrice: 0,
    currency: "INR",
    features: ["Everything in Team", "SSO", "SLA", "Custom integrations"],
  },
] as const;

function isIndianLocale(locale: string): boolean {
  return locale === "hi-IN" || locale === "en-IN" || locale.endsWith("-IN");
}

export function getPlans(query: PlansQuery): readonly PlanDetails[] {
  return isIndianLocale(query.locale) ? PLANS_INR : PLANS_USD;
}

// ── Subscription Status ───────────────────────────────────────────────

export async function getSubscription(
  userId: string,
): Promise<Subscription | { plan: "free"; status: "active" }> {
  const sub = await billingRepo.findSubscriptionByUserId(userId);

  if (!sub) {
    return { plan: "free" as const, status: "active" as const };
  }

  return sub;
}

// ── RevenueCat Webhook Processing ─────────────────────────────────────

type WebhookEventType = WebhookEvent["event"]["type"];

const PRODUCT_TO_PLAN: Record<string, "free" | "pro" | "team" | "enterprise"> = {
  unjynx_pro_monthly: "pro",
  unjynx_pro_annual: "pro",
  unjynx_team_monthly: "team",
  unjynx_team_annual: "team",
  unjynx_enterprise: "enterprise",
};

function resolvePlan(productId?: string): "free" | "pro" | "team" | "enterprise" {
  if (!productId) return "free";
  return PRODUCT_TO_PLAN[productId] ?? "free";
}

export async function processWebhookEvent(
  event: WebhookEvent,
): Promise<{ processed: boolean; action: string }> {
  const { type, app_user_id, product_id, expiration_at_ms, purchased_at_ms, transaction_id, price_in_purchased_currency, currency, new_product_id } = event.event;

  const handlers: Record<WebhookEventType, () => Promise<string>> = {
    INITIAL_PURCHASE: async () => {
      const plan = resolvePlan(product_id);
      await billingRepo.upsertSubscription({
        userId: app_user_id,
        plan,
        status: "active",
        revenueCatCustomerId: app_user_id,
        currentPeriodStart: purchased_at_ms ? new Date(purchased_at_ms) : new Date(),
        currentPeriodEnd: expiration_at_ms ? new Date(expiration_at_ms) : undefined,
      });

      if (transaction_id && price_in_purchased_currency) {
        await billingRepo.insertInvoice({
          userId: app_user_id,
          amount: Math.round(price_in_purchased_currency * 100),
          currency: currency ?? "USD",
          status: "paid",
          revenueCatTransactionId: transaction_id,
          paidAt: new Date(),
        });
      }

      return "subscription_created";
    },

    RENEWAL: async () => {
      await billingRepo.updateSubscriptionStatus(app_user_id, "active", {
        currentPeriodStart: purchased_at_ms ? new Date(purchased_at_ms) : new Date(),
        currentPeriodEnd: expiration_at_ms ? new Date(expiration_at_ms) : undefined,
      });

      if (transaction_id && price_in_purchased_currency) {
        await billingRepo.insertInvoice({
          userId: app_user_id,
          amount: Math.round(price_in_purchased_currency * 100),
          currency: currency ?? "USD",
          status: "paid",
          revenueCatTransactionId: transaction_id,
          paidAt: new Date(),
        });
      }

      return "subscription_renewed";
    },

    CANCELLATION: async () => {
      await billingRepo.updateSubscriptionStatus(app_user_id, "cancelled", {
        cancelledAt: new Date(),
      });
      return "subscription_cancelled";
    },

    BILLING_ISSUE: async () => {
      await billingRepo.updateSubscriptionStatus(app_user_id, "past_due");
      return "billing_issue_flagged";
    },

    EXPIRATION: async () => {
      await billingRepo.updateSubscriptionStatus(app_user_id, "expired");
      return "subscription_expired";
    },

    PRODUCT_CHANGE: async () => {
      const newPlan = resolvePlan(new_product_id ?? product_id);
      await billingRepo.updateSubscriptionStatus(app_user_id, "active", {
        plan: newPlan,
      });
      return "plan_changed";
    },
  };

  const handler = handlers[type];
  const action = await handler();

  // Audit log: record subscription changes from webhook
  try {
    await adminRepo.insertAuditEntry({
      userId: app_user_id,
      action: `subscription.${action}`,
      entityType: "subscription",
      entityId: app_user_id,
      metadata: JSON.stringify({
        webhookType: type,
        productId: product_id,
        newProductId: new_product_id,
        transactionId: transaction_id,
        source: "revenuecat_webhook",
      }),
    });
  } catch {
    // Non-critical: don't fail the webhook if audit logging fails
  }

  return { processed: true, action };
}

// ── Invoices ──────────────────────────────────────────────────────────

export async function getInvoices(
  userId: string,
  page: number,
  limit: number,
): Promise<{ items: Invoice[]; total: number }> {
  const offset = (page - 1) * limit;
  return billingRepo.findInvoices(userId, limit, offset);
}

// ── Coupon Validation ─────────────────────────────────────────────────

export interface CouponValidationResult {
  readonly valid: boolean;
  readonly discountPercent: number;
  readonly reason?: string;
}

export async function validateCoupon(
  userId: string,
  code: string,
): Promise<CouponValidationResult> {
  const coupon = await billingRepo.findCouponByCode(code);

  if (!coupon) {
    logCouponValidation(userId, code, false, "Coupon not found");
    return { valid: false, discountPercent: 0, reason: "Coupon not found" };
  }

  if (!coupon.isActive) {
    logCouponValidation(userId, code, false, "Coupon is inactive");
    return { valid: false, discountPercent: 0, reason: "Coupon is inactive" };
  }

  if (coupon.validUntil && new Date() > coupon.validUntil) {
    logCouponValidation(userId, code, false, "Coupon has expired");
    return { valid: false, discountPercent: 0, reason: "Coupon has expired" };
  }

  if (coupon.usedCount >= coupon.maxUses) {
    logCouponValidation(userId, code, false, "Coupon usage limit reached");
    return { valid: false, discountPercent: 0, reason: "Coupon usage limit reached" };
  }

  const alreadyRedeemed = await billingRepo.hasUserRedeemedCoupon(userId, coupon.id);
  if (alreadyRedeemed) {
    logCouponValidation(userId, code, false, "Coupon already redeemed");
    return { valid: false, discountPercent: 0, reason: "Coupon already redeemed" };
  }

  logCouponValidation(userId, code, true, undefined, coupon.discountPercent);
  return { valid: true, discountPercent: coupon.discountPercent };
}

/** Fire-and-forget audit log for coupon validation attempts. */
function logCouponValidation(
  userId: string,
  code: string,
  valid: boolean,
  reason?: string,
  discountPercent?: number,
): void {
  adminRepo.insertAuditEntry({
    userId,
    action: valid ? "coupon.validation_success" : "coupon.validation_failed",
    entityType: "coupon",
    entityId: code,
    metadata: JSON.stringify({ code, valid, reason, discountPercent }),
  }).catch(() => { /* non-critical */ });
}
