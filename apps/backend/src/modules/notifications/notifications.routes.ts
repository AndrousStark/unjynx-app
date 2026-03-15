import { Hono } from "hono";
import { zValidator } from "@hono/zod-validator";
import { authMiddleware } from "../../middleware/auth.js";
import { ok, err } from "../../types/api.js";
import {
  sendTestSchema,
  deliveryStatusQuerySchema,
  updateNotificationPreferencesSchema,
} from "./notifications.schema.js";
import * as notificationService from "./notifications.service.js";

export const notificationRoutes = new Hono();

notificationRoutes.use("/*", authMiddleware);

// ── POST /send-test ──────────────────────────────────────────────────
notificationRoutes.post(
  "/send-test",
  zValidator("json", sendTestSchema),
  async (c) => {
    const auth = c.get("auth");
    const { channel } = c.req.valid("json");

    try {
      await notificationService.sendTestNotification(
        auth.profileId,
        channel,
      );
      return c.json(ok({ sent: true, channel }), 201);
    } catch (error) {
      const message =
        error instanceof Error
          ? error.message
          : "Failed to send test notification";
      return c.json(err(message), 500);
    }
  },
);

// ── GET /status ──────────────────────────────────────────────────────
notificationRoutes.get(
  "/status",
  zValidator("query", deliveryStatusQuerySchema),
  async (c) => {
    const auth = c.get("auth");
    const { limit } = c.req.valid("query");
    const attempts = await notificationService.getDeliveryStatus(
      auth.profileId,
      limit,
    );

    return c.json(ok(attempts));
  },
);

// ── GET /quota ───────────────────────────────────────────────────────
notificationRoutes.get("/quota", async (c) => {
  const auth = c.get("auth");
  const usage = await notificationService.getQuotaUsage(auth.profileId);

  return c.json(ok(usage));
});

// ── GET /preferences ─────────────────────────────────────────────────
notificationRoutes.get("/preferences", async (c) => {
  const auth = c.get("auth");
  const prefs = await notificationService.getPreferences(auth.profileId);

  return c.json(ok(prefs));
});

// ── PUT /preferences ─────────────────────────────────────────────────
notificationRoutes.put(
  "/preferences",
  zValidator("json", updateNotificationPreferencesSchema),
  async (c) => {
    const auth = c.get("auth");
    const input = c.req.valid("json");

    try {
      const prefs = await notificationService.updatePreferences(
        auth.profileId,
        input,
      );
      return c.json(ok(prefs));
    } catch (error) {
      const message =
        error instanceof Error
          ? error.message
          : "Failed to update preferences";
      return c.json(err(message), 500);
    }
  },
);
