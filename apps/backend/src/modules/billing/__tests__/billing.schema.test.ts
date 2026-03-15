import { describe, it, expect } from "vitest";
import {
  webhookEventSchema,
  invoiceQuerySchema,
  validateCouponSchema,
  plansQuerySchema,
} from "../billing.schema.js";

describe("Billing Schemas", () => {
  // ── webhookEventSchema ────────────────────────────────────────────

  describe("webhookEventSchema", () => {
    it("validates a valid INITIAL_PURCHASE event", () => {
      const result = webhookEventSchema.safeParse({
        event: {
          type: "INITIAL_PURCHASE",
          app_user_id: "user-1",
          product_id: "unjynx_pro_monthly",
          purchased_at_ms: Date.now(),
          expiration_at_ms: Date.now() + 86400000,
          transaction_id: "tx-123",
          price_in_purchased_currency: 6.99,
          currency: "USD",
        },
      });
      expect(result.success).toBe(true);
    });

    it("validates a valid RENEWAL event", () => {
      const result = webhookEventSchema.safeParse({
        event: {
          type: "RENEWAL",
          app_user_id: "user-1",
        },
      });
      expect(result.success).toBe(true);
    });

    it("validates a valid CANCELLATION event", () => {
      const result = webhookEventSchema.safeParse({
        event: {
          type: "CANCELLATION",
          app_user_id: "user-2",
        },
      });
      expect(result.success).toBe(true);
    });

    it("validates BILLING_ISSUE event", () => {
      const result = webhookEventSchema.safeParse({
        event: {
          type: "BILLING_ISSUE",
          app_user_id: "user-3",
        },
      });
      expect(result.success).toBe(true);
    });

    it("validates EXPIRATION event", () => {
      const result = webhookEventSchema.safeParse({
        event: {
          type: "EXPIRATION",
          app_user_id: "user-4",
        },
      });
      expect(result.success).toBe(true);
    });

    it("validates PRODUCT_CHANGE event", () => {
      const result = webhookEventSchema.safeParse({
        event: {
          type: "PRODUCT_CHANGE",
          app_user_id: "user-5",
          new_product_id: "unjynx_team_annual",
        },
      });
      expect(result.success).toBe(true);
    });

    it("rejects invalid event type", () => {
      const result = webhookEventSchema.safeParse({
        event: {
          type: "INVALID_TYPE",
          app_user_id: "user-1",
        },
      });
      expect(result.success).toBe(false);
    });

    it("rejects missing app_user_id", () => {
      const result = webhookEventSchema.safeParse({
        event: {
          type: "RENEWAL",
        },
      });
      expect(result.success).toBe(false);
    });
  });

  // ── invoiceQuerySchema ────────────────────────────────────────────

  describe("invoiceQuerySchema", () => {
    it("uses defaults for empty input", () => {
      const result = invoiceQuerySchema.parse({});
      expect(result.page).toBe(1);
      expect(result.limit).toBe(20);
    });

    it("accepts custom page and limit", () => {
      const result = invoiceQuerySchema.parse({ page: "3", limit: "50" });
      expect(result.page).toBe(3);
      expect(result.limit).toBe(50);
    });

    it("rejects negative page", () => {
      const result = invoiceQuerySchema.safeParse({ page: "-1" });
      expect(result.success).toBe(false);
    });

    it("rejects limit > 100", () => {
      const result = invoiceQuerySchema.safeParse({ limit: "101" });
      expect(result.success).toBe(false);
    });
  });

  // ── validateCouponSchema ──────────────────────────────────────────

  describe("validateCouponSchema", () => {
    it("accepts valid code", () => {
      const result = validateCouponSchema.safeParse({ code: "SAVE20" });
      expect(result.success).toBe(true);
    });

    it("rejects empty code", () => {
      const result = validateCouponSchema.safeParse({ code: "" });
      expect(result.success).toBe(false);
    });

    it("rejects code exceeding max length", () => {
      const result = validateCouponSchema.safeParse({ code: "A".repeat(51) });
      expect(result.success).toBe(false);
    });
  });

  // ── plansQuerySchema ──────────────────────────────────────────────

  describe("plansQuerySchema", () => {
    it("defaults locale to en-US", () => {
      const result = plansQuerySchema.parse({});
      expect(result.locale).toBe("en-US");
    });

    it("accepts custom locale", () => {
      const result = plansQuerySchema.parse({ locale: "hi-IN" });
      expect(result.locale).toBe("hi-IN");
    });
  });
});
