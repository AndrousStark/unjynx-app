import { describe, it, expect, vi, beforeEach } from "vitest";

const mockFindSubscriptionByUserId = vi.fn();
const mockUpsertSubscription = vi.fn();
const mockUpdateSubscriptionStatus = vi.fn();
const mockInsertInvoice = vi.fn();
const mockFindInvoices = vi.fn();
const mockFindCouponByCode = vi.fn();
const mockHasUserRedeemedCoupon = vi.fn();

vi.mock("../billing.repository.js", () => ({
  findSubscriptionByUserId: (...args: unknown[]) => mockFindSubscriptionByUserId(...args),
  upsertSubscription: (...args: unknown[]) => mockUpsertSubscription(...args),
  updateSubscriptionStatus: (...args: unknown[]) => mockUpdateSubscriptionStatus(...args),
  insertInvoice: (...args: unknown[]) => mockInsertInvoice(...args),
  findInvoices: (...args: unknown[]) => mockFindInvoices(...args),
  findCouponByCode: (...args: unknown[]) => mockFindCouponByCode(...args),
  hasUserRedeemedCoupon: (...args: unknown[]) => mockHasUserRedeemedCoupon(...args),
}));

import {
  getPlans,
  getSubscription,
  processWebhookEvent,
  getInvoices,
  validateCoupon,
} from "../billing.service.js";

describe("Billing Service", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  // ── getPlans ────────────────────────────────────────────────────

  describe("getPlans", () => {
    it("returns USD plans for en-US locale", () => {
      const plans = getPlans({ locale: "en-US" });
      expect(plans.length).toBe(4);
      expect(plans[0].currency).toBe("USD");
      expect(plans[1].id).toBe("pro");
    });

    it("returns INR plans for hi-IN locale", () => {
      const plans = getPlans({ locale: "hi-IN" });
      expect(plans.length).toBe(4);
      expect(plans[0].currency).toBe("INR");
    });

    it("returns INR plans for en-IN locale", () => {
      const plans = getPlans({ locale: "en-IN" });
      expect(plans[0].currency).toBe("INR");
    });

    it("returns USD plans for unknown locale", () => {
      const plans = getPlans({ locale: "de-DE" });
      expect(plans[0].currency).toBe("USD");
    });

    it("includes free plan with zero price", () => {
      const plans = getPlans({ locale: "en-US" });
      const freePlan = plans.find((p) => p.id === "free");
      expect(freePlan?.monthlyPrice).toBe(0);
      expect(freePlan?.annualPrice).toBe(0);
    });
  });

  // ── getSubscription ─────────────────────────────────────────────

  describe("getSubscription", () => {
    it("returns default free plan when no subscription exists", async () => {
      mockFindSubscriptionByUserId.mockResolvedValueOnce(undefined);

      const result = await getSubscription("user-1");
      expect(result.plan).toBe("free");
      expect(result.status).toBe("active");
    });

    it("returns existing subscription", async () => {
      const sub = { plan: "pro", status: "active", userId: "user-1" };
      mockFindSubscriptionByUserId.mockResolvedValueOnce(sub);

      const result = await getSubscription("user-1");
      expect(result.plan).toBe("pro");
    });
  });

  // ── processWebhookEvent ─────────────────────────────────────────

  describe("processWebhookEvent", () => {
    it("processes INITIAL_PURCHASE event", async () => {
      mockUpsertSubscription.mockResolvedValueOnce({ plan: "pro" });

      const result = await processWebhookEvent({
        event: {
          type: "INITIAL_PURCHASE",
          app_user_id: "user-1",
          product_id: "unjynx_pro_monthly",
          purchased_at_ms: Date.now(),
          expiration_at_ms: Date.now() + 86400000,
        },
      });

      expect(result.processed).toBe(true);
      expect(result.action).toBe("subscription_created");
      expect(mockUpsertSubscription).toHaveBeenCalledWith(
        expect.objectContaining({
          userId: "user-1",
          plan: "pro",
          status: "active",
        }),
      );
    });

    it("processes RENEWAL event", async () => {
      mockUpdateSubscriptionStatus.mockResolvedValueOnce({ status: "active" });

      const result = await processWebhookEvent({
        event: {
          type: "RENEWAL",
          app_user_id: "user-1",
        },
      });

      expect(result.action).toBe("subscription_renewed");
    });

    it("processes CANCELLATION event", async () => {
      mockUpdateSubscriptionStatus.mockResolvedValueOnce({ status: "cancelled" });

      const result = await processWebhookEvent({
        event: {
          type: "CANCELLATION",
          app_user_id: "user-1",
        },
      });

      expect(result.action).toBe("subscription_cancelled");
      expect(mockUpdateSubscriptionStatus).toHaveBeenCalledWith(
        "user-1",
        "cancelled",
        expect.objectContaining({ cancelledAt: expect.any(Date) }),
      );
    });

    it("processes BILLING_ISSUE event", async () => {
      mockUpdateSubscriptionStatus.mockResolvedValueOnce({ status: "past_due" });

      const result = await processWebhookEvent({
        event: {
          type: "BILLING_ISSUE",
          app_user_id: "user-1",
        },
      });

      expect(result.action).toBe("billing_issue_flagged");
    });

    it("processes EXPIRATION event", async () => {
      mockUpdateSubscriptionStatus.mockResolvedValueOnce({ status: "expired" });

      const result = await processWebhookEvent({
        event: {
          type: "EXPIRATION",
          app_user_id: "user-1",
        },
      });

      expect(result.action).toBe("subscription_expired");
    });

    it("processes PRODUCT_CHANGE event", async () => {
      mockUpdateSubscriptionStatus.mockResolvedValueOnce({ plan: "team" });

      const result = await processWebhookEvent({
        event: {
          type: "PRODUCT_CHANGE",
          app_user_id: "user-1",
          new_product_id: "unjynx_team_monthly",
        },
      });

      expect(result.action).toBe("plan_changed");
    });

    it("creates invoice when transaction info provided", async () => {
      mockUpsertSubscription.mockResolvedValueOnce({ plan: "pro" });
      mockInsertInvoice.mockResolvedValueOnce({ id: "inv-1" });

      await processWebhookEvent({
        event: {
          type: "INITIAL_PURCHASE",
          app_user_id: "user-1",
          product_id: "unjynx_pro_monthly",
          transaction_id: "tx-123",
          price_in_purchased_currency: 6.99,
          currency: "USD",
        },
      });

      expect(mockInsertInvoice).toHaveBeenCalledWith(
        expect.objectContaining({
          amount: 699,
          currency: "USD",
          status: "paid",
        }),
      );
    });
  });

  // ── getInvoices ─────────────────────────────────────────────────

  describe("getInvoices", () => {
    it("fetches paginated invoices", async () => {
      mockFindInvoices.mockResolvedValueOnce({ items: [], total: 0 });

      const result = await getInvoices("user-1", 1, 20);

      expect(result.items).toEqual([]);
      expect(result.total).toBe(0);
      expect(mockFindInvoices).toHaveBeenCalledWith("user-1", 20, 0);
    });

    it("calculates offset correctly for page 3", async () => {
      mockFindInvoices.mockResolvedValueOnce({ items: [], total: 50 });

      await getInvoices("user-1", 3, 10);

      expect(mockFindInvoices).toHaveBeenCalledWith("user-1", 10, 20);
    });
  });

  // ── validateCoupon ──────────────────────────────────────────────

  describe("validateCoupon", () => {
    it("returns invalid for non-existent coupon", async () => {
      mockFindCouponByCode.mockResolvedValueOnce(undefined);

      const result = await validateCoupon("user-1", "NOPE");

      expect(result.valid).toBe(false);
      expect(result.reason).toBe("Coupon not found");
    });

    it("returns invalid for inactive coupon", async () => {
      mockFindCouponByCode.mockResolvedValueOnce({
        id: "c-1",
        isActive: false,
        discountPercent: 20,
        maxUses: 100,
        usedCount: 0,
      });

      const result = await validateCoupon("user-1", "SAVE20");

      expect(result.valid).toBe(false);
      expect(result.reason).toBe("Coupon is inactive");
    });

    it("returns invalid for expired coupon", async () => {
      mockFindCouponByCode.mockResolvedValueOnce({
        id: "c-1",
        isActive: true,
        discountPercent: 20,
        maxUses: 100,
        usedCount: 0,
        validUntil: new Date("2020-01-01"),
      });

      const result = await validateCoupon("user-1", "SAVE20");

      expect(result.valid).toBe(false);
      expect(result.reason).toBe("Coupon has expired");
    });

    it("returns invalid when usage limit reached", async () => {
      mockFindCouponByCode.mockResolvedValueOnce({
        id: "c-1",
        isActive: true,
        discountPercent: 20,
        maxUses: 5,
        usedCount: 5,
        validUntil: null,
      });

      const result = await validateCoupon("user-1", "SAVE20");

      expect(result.valid).toBe(false);
      expect(result.reason).toBe("Coupon usage limit reached");
    });

    it("returns invalid when already redeemed by user", async () => {
      mockFindCouponByCode.mockResolvedValueOnce({
        id: "c-1",
        isActive: true,
        discountPercent: 20,
        maxUses: 100,
        usedCount: 1,
        validUntil: null,
      });
      mockHasUserRedeemedCoupon.mockResolvedValueOnce(true);

      const result = await validateCoupon("user-1", "SAVE20");

      expect(result.valid).toBe(false);
      expect(result.reason).toBe("Coupon already redeemed");
    });

    it("returns valid for a good coupon", async () => {
      mockFindCouponByCode.mockResolvedValueOnce({
        id: "c-1",
        isActive: true,
        discountPercent: 25,
        maxUses: 100,
        usedCount: 3,
        validUntil: null,
      });
      mockHasUserRedeemedCoupon.mockResolvedValueOnce(false);

      const result = await validateCoupon("user-1", "SAVE25");

      expect(result.valid).toBe(true);
      expect(result.discountPercent).toBe(25);
    });
  });
});
