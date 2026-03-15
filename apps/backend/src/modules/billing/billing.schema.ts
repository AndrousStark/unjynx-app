import { z } from "zod";

export const webhookEventSchema = z.object({
  event: z.object({
    type: z.enum([
      "INITIAL_PURCHASE",
      "RENEWAL",
      "CANCELLATION",
      "BILLING_ISSUE",
      "EXPIRATION",
      "PRODUCT_CHANGE",
    ]),
    app_user_id: z.string(),
    product_id: z.string().optional(),
    entitlement_ids: z.array(z.string()).optional(),
    period_type: z.string().optional(),
    purchased_at_ms: z.number().optional(),
    expiration_at_ms: z.number().optional(),
    transaction_id: z.string().optional(),
    price_in_purchased_currency: z.number().optional(),
    currency: z.string().optional(),
    new_product_id: z.string().optional(),
  }),
  api_version: z.string().optional(),
});

export const invoiceQuerySchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
});

export const validateCouponSchema = z.object({
  code: z.string().min(1).max(50),
});

export const plansQuerySchema = z.object({
  locale: z.string().max(10).default("en-US"),
});

export type WebhookEvent = z.infer<typeof webhookEventSchema>;
export type InvoiceQuery = z.infer<typeof invoiceQuerySchema>;
export type ValidateCouponInput = z.infer<typeof validateCouponSchema>;
export type PlansQuery = z.infer<typeof plansQuerySchema>;
