// ── Webhook Handler ─────────────────────────────────────────────────
// Incoming webhook handler for channel callbacks. Processes delivery
// receipts and user replies from Telegram, WhatsApp (Gupshup), and
// SMS (MSG91). Each channel has its own POST endpoint.
//
// Routes:
//   POST /api/v1/webhooks/telegram
//   POST /api/v1/webhooks/whatsapp
//   POST /api/v1/webhooks/sms

import { Hono } from "hono";
import { eq, and } from "drizzle-orm";
import { db } from "../../db/index.js";
import {
  notificationChannels,
  deliveryAttempts,
} from "../../db/schema/index.js";
import { getAdapter } from "../../services/channels/adapter-registry.js";
import { renderTemplate } from "../../services/templates/template-engine.js";
import * as taskService from "../tasks/tasks.service.js";
import * as notificationRepo from "../notifications/notifications.repository.js";
import { logger } from "../../middleware/logger.js";

const log = logger.child({ module: "webhook-handler" });

export const webhookRoutes = new Hono();

// ── Constants ───────────────────────────────────────────────────────

const SNOOZE_DEFAULT_MINUTES = 15;
const VALID_SNOOZE_MINUTES = [5, 10, 15, 30, 60, 120] as const;

// ── Telegram Webhook ────────────────────────────────────────────────
// Handles inline keyboard callback queries from Telegram.
// Callback data format:
//   DONE:{taskId}
//   SNOOZE:{taskId}:{minutes}

webhookRoutes.post("/telegram", async (c) => {
  const body = await c.req.json() as TelegramWebhookPayload;

  // Telegram sends different update types — we handle callback_query
  if (body.callback_query) {
    const result = await handleTelegramCallback(body.callback_query);
    // Telegram expects 200 OK regardless of result
    return c.json({ ok: true, result });
  }

  // Acknowledge other update types (messages, etc.) without processing
  return c.json({ ok: true });
});

// ── WhatsApp Webhook (Gupshup) ──────────────────────────────────────
// Handles delivery receipts and incoming user replies.
// Gupshup sends events via POST with JSON body.
// User replies: "DONE", "SNOOZE", "SNOOZE 30", "STOP"

webhookRoutes.post("/whatsapp", async (c) => {
  const body = await c.req.json() as GupshupWebhookPayload;

  if (!body.type) {
    return c.json({ ok: true });
  }

  try {
    if (body.type === "message-event") {
      // Delivery receipt (delivered, read, failed)
      await handleWhatsAppDeliveryReceipt(body);
    } else if (body.type === "message") {
      // Incoming user reply
      await handleWhatsAppUserReply(body);
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
// User replies: "DONE", "SNOOZE", "SNOOZE 30", "STOP", "HELP"

webhookRoutes.post("/sms", async (c) => {
  const body = await c.req.json() as Msg91WebhookPayload;

  try {
    if (body.type === "dlr") {
      // Delivery receipt
      await handleSmsDeliveryReceipt(body);
    } else if (body.type === "mo") {
      // Mobile Originated (incoming reply)
      await handleSmsUserReply(body);
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

async function handleTelegramCallback(
  callbackQuery: TelegramCallbackQuery,
): Promise<{ readonly action: string; readonly success: boolean }> {
  const { data, from, message } = callbackQuery;

  if (!data) {
    return { action: "unknown", success: false };
  }

  log.info(
    { chatId: from.id, data },
    "Telegram callback received",
  );

  // Parse callback data: "ACTION:taskId" or "ACTION:taskId:param"
  const parts = data.split(":");
  const action = parts[0];
  const taskId = parts[1];

  if (!taskId) {
    return { action: action ?? "unknown", success: false };
  }

  // Look up the user by their Telegram chat ID
  const userId = await resolveUserByChannel("telegram", String(from.id));

  if (!userId) {
    log.warn({ chatId: from.id }, "No user found for Telegram chat ID");
    await sendTelegramReply(
      String(from.id),
      "Your Telegram account is not linked to UNJYNX. Connect it in the app first.",
    );
    return { action: action ?? "unknown", success: false };
  }

  switch (action) {
    case "DONE": {
      const task = await taskService.completeTask(userId, taskId);
      if (task) {
        await sendTelegramReply(
          String(from.id),
          `Done! '${task.title}' marked as complete. Keep it up!`,
        );
        return { action: "DONE", success: true };
      }
      await sendTelegramReply(String(from.id), "Task not found or already completed.");
      return { action: "DONE", success: false };
    }

    case "SNOOZE": {
      const minutes = parseInt(parts[2] ?? String(SNOOZE_DEFAULT_MINUTES), 10);
      const safeMinutes = VALID_SNOOZE_MINUTES.includes(minutes as typeof VALID_SNOOZE_MINUTES[number])
        ? minutes
        : SNOOZE_DEFAULT_MINUTES;

      const task = await taskService.snoozeTask(userId, taskId, safeMinutes);
      if (task) {
        await sendTelegramReply(
          String(from.id),
          `Snoozed '${task.title}' for ${safeMinutes} minutes.`,
        );
        return { action: "SNOOZE", success: true };
      }
      await sendTelegramReply(String(from.id), "Task not found.");
      return { action: "SNOOZE", success: false };
    }

    default:
      return { action: action ?? "unknown", success: false };
  }
}

// ── WhatsApp Handlers ───────────────────────────────────────────────

async function handleWhatsAppDeliveryReceipt(
  payload: GupshupWebhookPayload,
): Promise<void> {
  const { gsId, eventType } = payload.payload ?? {};

  if (!gsId) return;

  log.debug({ gsId, eventType }, "WhatsApp delivery receipt");

  // Map Gupshup event types to our delivery statuses
  const statusMap: Record<string, string> = {
    DELIVERED: "delivered",
    READ: "read",
    SENT: "sent",
    FAILED: "failed",
  };

  const newStatus = statusMap[eventType ?? ""] ?? null;
  if (!newStatus) return;

  // Update delivery attempt by provider message ID
  await updateDeliveryByProviderId(gsId, newStatus);
}

async function handleWhatsAppUserReply(
  payload: GupshupWebhookPayload,
): Promise<void> {
  const messageText = (payload.payload?.text ?? "").trim().toUpperCase();
  const senderPhone = payload.payload?.sender ?? "";

  if (!senderPhone || !messageText) return;

  log.info({ sender: senderPhone, message: messageText }, "WhatsApp reply received");

  const userId = await resolveUserByChannel("whatsapp", senderPhone);
  if (!userId) {
    log.warn({ sender: senderPhone }, "No user found for WhatsApp number");
    return;
  }

  const result = await processTextReply(userId, messageText, "whatsapp", senderPhone);

  if (result.replyText) {
    await sendChannelReply("whatsapp", senderPhone, result.replyText);
  }
}

// ── SMS Handlers ────────────────────────────────────────────────────

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

async function handleSmsUserReply(
  payload: Msg91WebhookPayload,
): Promise<void> {
  const messageText = (payload.message ?? "").trim().toUpperCase();
  const senderPhone = payload.sender ?? "";

  if (!senderPhone || !messageText) return;

  log.info({ sender: senderPhone, message: messageText }, "SMS reply received");

  const userId = await resolveUserByChannel("sms", senderPhone);
  if (!userId) {
    log.warn({ sender: senderPhone }, "No user found for SMS number");
    return;
  }

  const result = await processTextReply(userId, messageText, "sms", senderPhone);

  if (result.replyText) {
    await sendChannelReply("sms", senderPhone, result.replyText);
  }
}

// ── Generic Text Reply Processor ────────────────────────────────────
// Handles DONE, SNOOZE, STOP, HELP commands from WhatsApp and SMS.

interface TextReplyResult {
  readonly action: string;
  readonly success: boolean;
  readonly replyText: string | null;
}

async function processTextReply(
  userId: string,
  messageText: string,
  channel: string,
  senderIdentifier: string,
): Promise<TextReplyResult> {
  const parts = messageText.split(/\s+/);
  const command = parts[0];

  switch (command) {
    case "DONE": {
      // Mark the most recent notified task as complete
      const recentTask = await findMostRecentNotifiedTask(userId);
      if (recentTask) {
        const task = await taskService.completeTask(userId, recentTask.taskId);
        if (task) {
          return {
            action: "DONE",
            success: true,
            replyText: `Done! '${task.title}' marked as complete.`,
          };
        }
      }
      return {
        action: "DONE",
        success: false,
        replyText: "No recent task found to complete. Open the app to manage your tasks.",
      };
    }

    case "SNOOZE": {
      const minutes = parseInt(parts[1] ?? String(SNOOZE_DEFAULT_MINUTES), 10);
      const safeMinutes = isNaN(minutes) || minutes < 1 || minutes > 1440
        ? SNOOZE_DEFAULT_MINUTES
        : minutes;

      const recentTask = await findMostRecentNotifiedTask(userId);
      if (recentTask) {
        const task = await taskService.snoozeTask(userId, recentTask.taskId, safeMinutes);
        if (task) {
          return {
            action: "SNOOZE",
            success: true,
            replyText: `Snoozed '${task.title}' for ${safeMinutes} minutes.`,
          };
        }
      }
      return {
        action: "SNOOZE",
        success: false,
        replyText: "No recent task found to snooze.",
      };
    }

    case "STOP": {
      // Disable the channel for this user
      await disableUserChannel(userId, channel);
      return {
        action: "STOP",
        success: true,
        replyText: `${channel.charAt(0).toUpperCase() + channel.slice(1)} notifications disabled. You can re-enable them in the UNJYNX app.`,
      };
    }

    case "HELP": {
      return {
        action: "HELP",
        success: true,
        replyText: [
          "UNJYNX Commands:",
          "DONE - Complete your most recent task",
          "SNOOZE - Snooze for 15 min (or SNOOZE 30)",
          "STOP - Disable notifications on this channel",
          "HELP - Show this message",
        ].join("\n"),
      };
    }

    default:
      return {
        action: "unknown",
        success: false,
        replyText: "Unknown command. Reply HELP for available commands.",
      };
  }
}

// ── Helper: Resolve User by Channel ─────────────────────────────────
// Looks up which user owns a particular channel identifier.

async function resolveUserByChannel(
  channelType: string,
  identifier: string,
): Promise<string | null> {
  const [channel] = await db
    .select()
    .from(notificationChannels)
    .where(
      and(
        eq(
          notificationChannels.channelType,
          channelType as typeof notificationChannels.channelType.enumValues[number],
        ),
        eq(notificationChannels.channelIdentifier, identifier),
        eq(notificationChannels.isEnabled, true),
      ),
    );

  return channel?.userId ?? null;
}

// ── Helper: Find Most Recent Notified Task ──────────────────────────
// Returns the taskId from the most recent notification sent to this user.

async function findMostRecentNotifiedTask(
  userId: string,
): Promise<{ readonly taskId: string } | null> {
  const recent = await notificationRepo.findPendingNotifications(userId, 1);

  if (recent.length === 0 || !recent[0].taskId) {
    return null;
  }

  return { taskId: recent[0].taskId };
}

// ── Helper: Disable User Channel ────────────────────────────────────

async function disableUserChannel(
  userId: string,
  channelType: string,
): Promise<void> {
  await db
    .update(notificationChannels)
    .set({ isEnabled: false, updatedAt: new Date() })
    .where(
      and(
        eq(notificationChannels.userId, userId),
        eq(
          notificationChannels.channelType,
          channelType as typeof notificationChannels.channelType.enumValues[number],
        ),
      ),
    );

  log.info({ userId, channelType }, "Channel disabled via STOP command");
}

// ── Helper: Update Delivery Attempt by Provider Message ID ──────────

async function updateDeliveryByProviderId(
  providerMessageId: string,
  status: string,
): Promise<void> {
  const [attempt] = await db
    .select()
    .from(deliveryAttempts)
    .where(eq(deliveryAttempts.providerMessageId, providerMessageId));

  if (!attempt) {
    log.debug({ providerMessageId }, "No delivery attempt found for provider message ID");
    return;
  }

  const updates: Record<string, unknown> = {
    status: status as "pending" | "queued" | "sent" | "delivered" | "read" | "failed",
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

// ── Helper: Send Reply via Channel Adapter ──────────────────────────

async function sendTelegramReply(
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
      "Failed to send Telegram reply",
    );
  }
}

async function sendChannelReply(
  channel: string,
  recipient: string,
  text: string,
): Promise<void> {
  const adapter = getAdapter(channel);
  if (!adapter) return;

  try {
    await adapter.send(recipient, { text });
  } catch (error) {
    log.error(
      { channel, recipient, error: error instanceof Error ? error.message : "Unknown" },
      "Failed to send channel reply",
    );
  }
}

// ── Telegram Types (minimal subset for webhook) ─────────────────────

interface TelegramWebhookPayload {
  readonly update_id: number;
  readonly callback_query?: TelegramCallbackQuery;
  readonly message?: {
    readonly message_id: number;
    readonly from: { readonly id: number };
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
