// ── Notification Dispatcher ──────────────────────────────────────────
// Bridges scheduler output → queue → adapter delivery pipeline.
// Takes NotificationJobData arrays produced by planReminders,
// planOverdueAlerts, planDigest and dispatches them into the
// appropriate channel queues for async processing.

import { logger } from "../../middleware/logger.js";
import { getAdapter } from "../../services/channels/adapter-registry.js";
import { renderTemplate } from "../../services/templates/template-engine.js";
import * as notificationRepo from "../notifications/notifications.repository.js";
import { isQuietHoursActive, nextDeliveryAfterQuietHours } from "./quiet-hours.js";
import type { NotificationJobData } from "../../queue/types.js";
import type { UserPrefs } from "./scheduler.service.js";

// ── Provider Map ────────────────────────────────────────────────────
const CHANNEL_PROVIDER_MAP: Readonly<Record<string, string>> = {
  push: "fcm",
  telegram: "telegram-bot-api",
  email: "sendgrid",
  whatsapp: "gupshup",
  sms: "msg91",
  instagram: "messenger-api",
  slack: "slack-api",
  discord: "discord-api",
};

const log = logger.child({ module: "notification-dispatcher" });

// ── Dispatch a single notification job ──────────────────────────────

export async function dispatchJob(
  job: NotificationJobData,
  userPrefs?: Pick<UserPrefs, "quietStart" | "quietEnd" | "timezone" | "overrideForUrgent">,
): Promise<{ readonly success: boolean; readonly reason?: string }> {
  const { channel, messageType, templateVars, userId, notificationId } = job;

  // Check quiet hours (if prefs provided)
  if (userPrefs) {
    const taskPriority = job.priority <= 2 ? "urgent" : "normal";
    const isQuiet = isQuietHoursActive(
      userPrefs.quietStart,
      userPrefs.quietEnd,
      userPrefs.timezone,
      userPrefs.overrideForUrgent,
      taskPriority,
    );

    if (isQuiet) {
      log.info({ userId, channel, notificationId }, "Suppressed: quiet hours active");
      return { success: false, reason: "quiet_hours" };
    }
  }

  // Render template
  const message = renderTemplate(channel, messageType, templateVars);

  // Get adapter
  const adapter = getAdapter(channel);
  if (!adapter) {
    log.warn({ channel }, "No adapter registered for channel");
    return { success: false, reason: "no_adapter" };
  }

  // Persist notification record
  const notification = await notificationRepo.insertNotification({
    userId,
    taskId: job.taskId,
    type: messageType as "task_reminder" | "overdue_alert" | "streak_nudge" | "daily_digest" | "content_delivery" | "team_update" | "system",
    title: message.subject ?? message.text.slice(0, 100),
    body: message.text,
    scheduledAt: new Date(),
    priority: job.priority,
    cascadeId: job.cascadeId,
  });

  // Create delivery attempt record
  const attempt = await notificationRepo.insertDeliveryAttempt({
    notificationId: notification.id,
    channel: channel as "push" | "telegram" | "email" | "whatsapp" | "sms" | "instagram" | "slack" | "discord",
    provider: CHANNEL_PROVIDER_MAP[channel] ?? "unknown",
    status: "queued",
    queuedAt: new Date(),
    attemptNumber: job.attemptNumber,
  });

  // Send via adapter
  try {
    const result = await adapter.send(
      // In production, look up the channel identifier from the user's connected channels.
      // For now, the recipient is encoded in templateVars or fetched from the channels table.
      templateVars._recipient ?? "",
      message,
    );

    if (result.success) {
      await notificationRepo.updateDeliveryAttempt(attempt.id, {
        status: "sent",
        sentAt: new Date(),
        providerMessageId: result.providerMessageId,
        costAmount: result.costAmount,
        costCurrency: result.costCurrency,
      });

      log.info({ userId, channel, notificationId: notification.id }, "Notification sent");
      return { success: true };
    }

    await notificationRepo.updateDeliveryAttempt(attempt.id, {
      status: "failed",
      failedAt: new Date(),
      errorType: result.errorType,
      errorMessage: result.errorMessage,
    });

    log.warn(
      { userId, channel, errorType: result.errorType },
      "Notification delivery failed",
    );

    return { success: false, reason: result.errorType ?? "send_failed" };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : "Unknown dispatch error";

    await notificationRepo.updateDeliveryAttempt(attempt.id, {
      status: "failed",
      failedAt: new Date(),
      errorType: "dispatch_exception",
      errorMessage,
    });

    log.error({ userId, channel, error: errorMessage }, "Dispatch exception");
    return { success: false, reason: "dispatch_exception" };
  }
}

// ── Dispatch a batch of notification jobs ───────────────────────────

export async function dispatchBatch(
  jobs: readonly NotificationJobData[],
  userPrefs?: Pick<UserPrefs, "quietStart" | "quietEnd" | "timezone" | "overrideForUrgent">,
): Promise<{
  readonly dispatched: number;
  readonly suppressed: number;
  readonly failed: number;
}> {
  let dispatched = 0;
  let suppressed = 0;
  let failed = 0;

  for (const job of jobs) {
    const result = await dispatchJob(job, userPrefs);
    if (result.success) {
      dispatched += 1;
    } else if (result.reason === "quiet_hours") {
      suppressed += 1;
    } else {
      failed += 1;
    }
  }

  log.info(
    { dispatched, suppressed, failed, total: jobs.length },
    "Batch dispatch complete",
  );

  return { dispatched, suppressed, failed };
}
