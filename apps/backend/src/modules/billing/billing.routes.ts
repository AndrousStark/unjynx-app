import { Hono } from "hono";
import { zValidator } from "@hono/zod-validator";
import { authMiddleware } from "../../middleware/auth.js";
import { ok, err, paginated } from "../../types/api.js";
import { env } from "../../env.js";
import {
  webhookEventSchema,
  invoiceQuerySchema,
  validateCouponSchema,
  plansQuerySchema,
} from "./billing.schema.js";
import * as billingService from "./billing.service.js";

/**
 * Constant-time string comparison to prevent timing attacks.
 * Always compares the full length regardless of mismatch position.
 */
function timingSafeCompare(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  let mismatch = 0;
  for (let i = 0; i < a.length; i++) {
    mismatch |= a.charCodeAt(i) ^ b.charCodeAt(i);
  }
  return mismatch === 0;
}

export const billingRoutes = new Hono();

// ── Public: Available plans ───────────────────────────────────────────

billingRoutes.get(
  "/plans",
  zValidator("query", plansQuerySchema),
  async (c) => {
    const query = c.req.valid("query");
    const plans = billingService.getPlans(query);
    return c.json(ok(plans));
  },
);

// ── Webhook: RevenueCat (no auth, verify signature) ──────────────────

billingRoutes.post(
  "/webhook",
  zValidator("json", webhookEventSchema),
  async (c) => {
    const signature = c.req.header("Authorization") ?? "";
    const expected = `Bearer ${env.REVENUECAT_WEBHOOK_SECRET}`;

    // Constant-time comparison to prevent timing attacks on webhook secrets
    if (!timingSafeCompare(signature, expected)) {
      return c.json(err("Invalid webhook signature"), 401);
    }

    const body = c.req.valid("json");

    try {
      const result = await billingService.processWebhookEvent(body);
      return c.json(ok(result));
    } catch (error) {
      const message = error instanceof Error ? error.message : "Webhook processing failed";
      return c.json(err(message), 500);
    }
  },
);

// ── Authenticated routes ──────────────────────────────────────────────

billingRoutes.use("/subscription", authMiddleware);
billingRoutes.use("/invoices", authMiddleware);
billingRoutes.use("/coupon/*", authMiddleware);

// GET /subscription - Current user's subscription status
billingRoutes.get("/subscription", async (c) => {
  const auth = c.get("auth");
  const subscription = await billingService.getSubscription(auth.profileId);
  return c.json(ok(subscription));
});

// GET /invoices - Invoice history (paginated)
billingRoutes.get(
  "/invoices",
  zValidator("query", invoiceQuerySchema),
  async (c) => {
    const auth = c.get("auth");
    const query = c.req.valid("query");
    const { items, total } = await billingService.getInvoices(
      auth.profileId,
      query.page,
      query.limit,
    );

    return c.json(paginated(items, total, query.page, query.limit));
  },
);

// POST /coupon/validate - Validate a coupon code
billingRoutes.post(
  "/coupon/validate",
  zValidator("json", validateCouponSchema),
  async (c) => {
    const auth = c.get("auth");
    const { code } = c.req.valid("json");
    const result = await billingService.validateCoupon(auth.profileId, code);
    return c.json(ok(result));
  },
);
