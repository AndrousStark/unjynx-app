// ── Webhook Handler ─────────────────────────────────────────────────
// Incoming webhook handler for channel callbacks. Processes delivery
// receipts and user replies from Telegram, WhatsApp (Gupshup), and
// SMS (MSG91). Each channel has its own POST endpoint.
//
// Routes:
//   POST /api/v1/webhooks/telegram  — callback queries + text messages
//   POST /api/v1/webhooks/whatsapp  — Gupshup delivery + inbound
//   POST /api/v1/webhooks/sms       — MSG91 delivery + inbound
//
// All endpoints are PUBLIC (no auth) but VERIFIED per provider.
// Responses are always 200 OK (providers retry on non-2xx).

import { Hono } from "hono";
import { eq, and } from "drizzle-orm";
import { db } from "../../db/index.js";
import {
  notificationChannels,
  deliveryAttempts,
} from "../../db/schema/index.js";
import { getAdapter } from "../../services/channels/adapter-registry.js";
import * as taskService from "../tasks/tasks.service.js";
import * as notificationRepo from "../notifications/notifications.repository.js";
import { handleInboundMessage } from "./inbound-handler.js";
import {
  verifyTelegramWebhook,
  verifyWhatsAppSignature,
  verifySmsWebhook,
} from "./webhook-verify.js";
import { logger } from "../../middleware/logger.js";

const log = logger.child({ module: "webhook-handler" });

export const webhookRoutes = new Hono();

// ── Constants ───────────────────────────────────────────────────────

const SNOOZE_DEFAULT_MINUTES = 15;
const VALID_SNOOZE_MINUTES = [5, 10, 15, 30, 60, 120] as const;

// ── Telegram Webhook ────────────────────────────────────────────────
// Handles two update types:
//   1. callback_query — inline button presses (DONE:{taskId}, SNOOZE:{taskId}:{min})
//   2. message.text   — plain text replies (DONE, SNOOZE 1h, STOP, HELP)

webhookRoutes.post("/telegram", async (c) => {
  if (!verifyTelegramWebhook(c)) {
    // Return 200 even on verification failure to avoid Telegram retries
    log.warn("Telegram webhook rejected: verification failed");
    return c.json({ ok: true });
  }

  const body = (await c.req.json()) as TelegramWebhookPayload;

  try {
    // Priority 1: Inline keyboard callback
    if (body.callback_query) {
      const result = await handleTelegramCallback(body.callback_query);
      return c.json({ ok: true, result });
    }

    // Priority 2: Plain text message reply
    if (body.message?.text) {
      const chatId = String(
        body.message.chat?.id ?? body.message.from.id,
      );
      const result = await handleInboundMessage(
        "telegram",
        chatId,
        body.message.text,
      );
      return c.json({ ok: true, result });
    }
  } catch (error) {
    log.error(
      { error: error instanceof Error ? error.message : "Unknown error" },
      "Telegram webhook processing error",
    );
  }

  // Acknowledge all other update types
  return c.json({ ok: true });
});

// ── WhatsApp Webhook (Gupshup) ──────────────────────────────────────
// Handles delivery receipts and incoming user replies.
// Gupshup sends events via POST with JSON body.
// User replies: "DONE", "COMPLETE", "SNOOZE 1h", "STOP", "HELP", "?"

webhookRoutes.post("/whatsapp", async (c) => {
  // Read raw body once for signature verification, then parse as JSON
  const rawBody = await c.req.text();

  if (!verifyWhatsAppSignature(c, rawBody)) {
    log.warn("WhatsApp webhook rejected: verification failed");
    return c.json({ ok: true });
  }

  const body = JSON.parse(rawBody) as GupshupWebhookPayload;

  if (!body.type) {
    return c.json({ ok: true });
  }

  try {
    if (body.type === "message-event") {
      // Delivery receipt (delivered, read, failed)
      await handleWhatsAppDeliveryReceipt(body);
    } else if (body.type === "message") {
      // Incoming user reply — delegate to inbound handler
      const senderPhone = body.payload?.sender ?? "";
      const messageText = (body.payload?.text ?? "").trim();

      if (senderPhone && messageText) {
        await handleInboundMessage("whatsapp", senderPhone, messageText);
      }
    }
  } catch (error) {
    log.error(
      { error: error instanceof Error ? error.message : "Unknown error" },
      "WhatsApp webhook processing error",
    );
  }

  return c.json({ ok: true });
});

// ── SMS Webhook (MSG91) ─────────────────────────────────────────────
// Handles delivery receipts and incoming SMS replies.
// MSG91 delivery receipts come as POST with JSON body.
// User replies: "DONE", "FINISHED", "SNOOZE 30m", "STOP", "HELP"

webhookRoutes.post("/sms", async (c) => {
  if (!verifySmsWebhook(c)) {
    log.warn("SMS webhook rejected: verification failed");
    return c.json({ ok: true });
  }

  const body = (await c.req.json()) as Msg91WebhookPayload;

  try {
    if (body.type === "dlr") {
      // Delivery receipt
      await handleSmsDeliveryReceipt(body);
    } else if (body.type === "mo") {
      // Mobile Originated (incoming reply) — delegate to inbound handler
      const senderPhone = body.sender ?? "";
      const messageText = (body.message ?? "").trim();

      if (senderPhone && messageText) {
        await handleInboundMessage("sms", senderPhone, messageText);
      }
    }
  } catch (error) {
    log.error(
      { error: error instanceof Error ? error.message : "Unknown error" },
      "SMS webhook processing error",
    );
  }

  return c.json({ ok: true });
});

// ── Telegram Callback Handler ───────────────────────────────────────
// Handles inline keyboard button presses (structured callback_data).
// These have taskId embedded in the data, unlike text replies.

async function handleTelegramCallback(
  callbackQuery: TelegramCallbackQuery,
): Promise<{ readonly action: string; readonly success: boolean }> {
  const { data, from } = callbackQuery;

  if (!data) {
    return { action: "unknown", success: false };
  }

  log.info({ chatId: from.id, data }, "Telegram callback received");

  // Parse callback data: "ACTION:taskId" or "ACTION:taskId:param"
  const parts = data.split(":");
  const action = parts[0];
  const taskId = parts[1];

  if (!taskId) {
    return { action: action ?? "unknown", success: false };
  }

  // Look up the user by their Telegram chat ID
  const chatId = String(from.id);
  const result = await resolveAndExecuteCallback(chatId, action, taskId, parts);
  return result;
}

async function resolveAndExecuteCallback(
  chatId: string,
  action: string | undefined,
  taskId: string,
  parts: readonly string[],
): Promise<{ readonly action: string; readonly success: boolean }> {
  const userId = await resolveUserFromTelegram(chatId);

  if (!userId) {
    log.warn({ chatId }, "No user found for Telegram chat ID");
    await sendTelegramCallbackReply(
      chatId,
      "Your Telegram account is not linked to UNJYNX. Connect it in the app first.",
    );
    return { action: action ?? "unknown", success: false };
  }

  switch (action) {
    case "DONE": {
      const task = await taskService.completeTask(userId, taskId);
      if (task) {
        await sendTelegramCallbackReply(
          chatId,
          `Done! '${task.title}' marked as complete. Keep it up!`,
        );
        return { action: "DONE", success: true };
      }
      await sendTelegramCallbackReply(
        chatId,
        "Task not found or already completed.",
      );
      return { action: "DONE", success: false };
    }

    case "SNOOZE": {
      const minutes = parseInt(
        parts[2] ?? String(SNOOZE_DEFAULT_MINUTES),
        10,
      );
      const safeMinutes = VALID_SNOOZE_MINUTES.includes(
        minutes as (typeof VALID_SNOOZE_MINUTES)[number],
      )
        ? minutes
        : SNOOZE_DEFAULT_MINUTES;

      const task = await taskService.snoozeTask(userId, taskId, safeMinutes);
      if (task) {
        await sendTelegramCallbackReply(
          chatId,
          `Snoozed '${task.title}' for ${safeMinutes} minutes.`,
        );
        return { action: "SNOOZE", success: true };
      }
      await sendTelegramCallbackReply(chatId, "Task not found.");
      return { action: "SNOOZE", success: false };
    }

    default:
      return { action: action ?? "unknown", success: false };
  }
}

// ── WhatsApp Delivery Receipt Handler ───────────────────────────────

async function handleWhatsAppDeliveryReceipt(
  payload: GupshupWebhookPayload,
): Promise<void> {
  const { gsId, eventType } = payload.payload ?? {};

  if (!gsId) return;

  log.debug({ gsId, eventType }, "WhatsApp delivery receipt");

  const statusMap: Record<string, string> = {
    DELIVERED: "delivered",
    READ: "read",
    SENT: "sent",
    FAILED: "failed",
  };

  const newStatus = statusMap[eventType ?? ""] ?? null;
  if (!newStatus) return;

  await updateDeliveryByProviderId(gsId, newStatus);
}

// ── SMS Delivery Receipt Handler ────────────────────────────────────

async function handleSmsDeliveryReceipt(
  payload: Msg91WebhookPayload,
): Promise<void> {
  const { requestId, status } = payload;

  if (!requestId) return;

  log.debug({ requestId, status }, "SMS delivery receipt");

  const statusMap: Record<string, string> = {
    DELIVRD: "delivered",
    FAILED: "failed",
    UNDELIV: "failed",
    REJECTED: "failed",
  };

  const newStatus = statusMap[status ?? ""] ?? null;
  if (!newStatus) return;

  await updateDeliveryByProviderId(requestId, newStatus);
}

// ── Helper: Resolve Telegram User ───────────────────────────────────

async function resolveUserFromTelegram(chatId: string): Promise<string | null> {
  const [channel] = await db
    .select()
    .from(notificationChannels)
    .where(
      and(
        eq(
          notificationChannels.channelType,
          "telegram" as typeof notificationChannels.channelType.enumValues[number],
        ),
        eq(notificationChannels.channelIdentifier, chatId),
        eq(notificationChannels.isEnabled, true),
      ),
    );

  return channel?.userId ?? null;
}

// ── Helper: Update Delivery Attempt ─────────────────────────────────

async function updateDeliveryByProviderId(
  providerMessageId: string,
  status: string,
): Promise<void> {
  const [attempt] = await db
    .select()
    .from(deliveryAttempts)
    .where(eq(deliveryAttempts.providerMessageId, providerMessageId));

  if (!attempt) {
    log.debug(
      { providerMessageId },
      "No delivery attempt found for provider message ID",
    );
    return;
  }

  const updates: Record<string, unknown> = {
    status: status as
      | "pending"
      | "queued"
      | "sent"
      | "delivered"
      | "read"
      | "failed",
    updatedAt: new Date(),
  };

  if (status === "delivered") {
    updates.deliveredAt = new Date();
    if (attempt.sentAt) {
      updates.deliveryLatencyMs = Date.now() - attempt.sentAt.getTime();
    }
  } else if (status === "read") {
    updates.readAt = new Date();
  } else if (status === "failed") {
    updates.failedAt = new Date();
  }

  await notificationRepo.updateDeliveryAttempt(attempt.id, updates);
}

// ── Helper: Send Telegram Reply (for callback_query) ────────────────

async function sendTelegramCallbackReply(
  chatId: string,
  text: string,
): Promise<void> {
  const adapter = getAdapter("telegram");
  if (!adapter) return;

  try {
    await adapter.send(chatId, { text });
  } catch (error) {
    log.error(
      { chatId, error: error instanceof Error ? error.message : "Unknown" },
      "Failed to send Telegram callback reply",
    );
  }
}

// ── Telegram Types ──────────────────────────────────────────────────

interface TelegramWebhookPayload {
  readonly update_id: number;
  readonly callback_query?: TelegramCallbackQuery;
  readonly message?: {
    readonly message_id: number;
    readonly from: { readonly id: number };
    readonly chat?: { readonly id: number };
    readonly text?: string;
  };
}

interface TelegramCallbackQuery {
  readonly id: string;
  readonly from: { readonly id: number; readonly first_name?: string };
  readonly message?: {
    readonly message_id: number;
    readonly chat: { readonly id: number };
  };
  readonly data?: string;
}

// ── Gupshup Types (WhatsApp) ────────────────────────────────────────

interface GupshupWebhookPayload {
  readonly type?: string;
  readonly payload?: {
    readonly gsId?: string;
    readonly eventType?: string;
    readonly sender?: string;
    readonly text?: string;
    readonly type?: string;
  };
}

// ── MSG91 Types (SMS) ───────────────────────────────────────────────

interface Msg91WebhookPayload {
  readonly type?: string;
  readonly requestId?: string;
  readonly status?: string;
  readonly sender?: string;
  readonly message?: string;
}
