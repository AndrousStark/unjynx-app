// ── BullMQ Workers ──────────────────────────────────────────────────
// One worker per channel queue. Each worker:
//  1. Checks quiet hours before processing
//  2. Renders the message via the template engine
//  3. Resolves the recipient via the channel repository
//  4. Calls the channel adapter to deliver the message
//  5. Records the delivery attempt in the database
//  6. On final failure, escalates to the next channel in the cascade

import { Worker } from "bullmq";
import type { Job, WorkerOptions } from "bullmq";
import type { NotificationJobData, ChannelQueueName, ChannelWorkerResult } from "./types.js";
import { CHANNEL_QUEUES } from "./types.js";
import { createWorkerConnection } from "./connection.js";
import type { ChannelAdapter } from "../services/channels/channel-adapter.interface.js";
import { renderTemplate } from "../services/templates/template-engine.js";
import { getRetryConfig } from "./retry-policy.js";
import pino from "pino";

const logger = pino({ name: "queue:workers" });

// ── Port Interfaces ─────────────────────────────────────────────────
// Injected via initializeWorkers() so workers remain testable.

export interface WorkerAdapterPort {
  getAdapter(channelType: string): ChannelAdapter | null;
}

export interface WorkerChannelPort {
  findChannel(
    userId: string,
    channelType: string,
  ): Promise<{ readonly channelIdentifier: string; readonly isEnabled: boolean } | undefined>;
}

export interface WorkerDeliveryPort {
  insertDeliveryAttempt(data: {
    notificationId: string;
    channel: string;
    provider: string;
    status: string;
    queuedAt: Date;
    bullmqJobId?: string;
    attemptNumber?: number;
    maxAttempts?: number;
  }): Promise<{ readonly id: string }>;

  updateDeliveryAttempt(
    id: string,
    data: Record<string, unknown>,
  ): Promise<unknown>;
}

export interface WorkerPreferencesPort {
  getPreferences(userId: string): Promise<{
    readonly quietStart: string | null;
    readonly quietEnd: string | null;
    readonly timezone: string;
    readonly fallbackChain: string | null;
  } | undefined>;
}

export interface WorkerQuietHoursPort {
  isQuietHoursActive(
    quietStart: string | null,
    quietEnd: string | null,
    timezone: string,
    overrideForUrgent: boolean,
    taskPriority: string,
    now?: Date,
  ): boolean;
}

export interface WorkerEscalationPort {
  enqueueEscalation(
    data: NotificationJobData,
    nextChannel: string,
    delayMs: number,
  ): Promise<void>;
}

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

// ── Worker State ────────────────────────────────────────────────────

const workers = new Map<ChannelQueueName, Worker<NotificationJobData, ChannelWorkerResult>>();

// ── Process Job ─────────────────────────────────────────────────────

export async function processNotificationJob(
  job: Job<NotificationJobData, ChannelWorkerResult>,
  ports: {
    readonly adapters: WorkerAdapterPort;
    readonly channels: WorkerChannelPort;
    readonly delivery: WorkerDeliveryPort;
    readonly preferences: WorkerPreferencesPort;
    readonly quietHours: WorkerQuietHoursPort;
    readonly escalation: WorkerEscalationPort;
  },
): Promise<ChannelWorkerResult> {
  const { data } = job;
  const startTime = Date.now();

  const provider = CHANNEL_PROVIDER_MAP[data.channel] ?? "unknown";

  // 1. Create delivery attempt record
  const attempt = await ports.delivery.insertDeliveryAttempt({
    notificationId: data.notificationId,
    channel: data.channel,
    provider,
    status: "queued",
    queuedAt: new Date(),
    bullmqJobId: job.id,
    attemptNumber: data.attemptNumber,
    maxAttempts: getRetryConfig(data.channel).maxAttempts,
  });

  try {
    // 2. Check quiet hours
    const prefs = await ports.preferences.getPreferences(data.userId);
    if (prefs) {
      const isQuiet = ports.quietHours.isQuietHoursActive(
        prefs.quietStart,
        prefs.quietEnd,
        prefs.timezone,
        data.priority <= 2, // urgent/high bypass quiet hours
        data.priority <= 1 ? "urgent" : "normal",
      );

      if (isQuiet) {
        logger.info(
          { jobId: job.id, channel: data.channel, userId: data.userId },
          "Suppressed by quiet hours",
        );
        await ports.delivery.updateDeliveryAttempt(attempt.id, {
          status: "pending",
          errorType: "quiet_hours",
          errorMessage: "Deferred due to quiet hours",
        });
        return {
          success: false,
          errorType: "quiet_hours",
          errorMessage: "Deferred due to quiet hours",
        };
      }
    }

    // 3. Update status to processing
    await ports.delivery.updateDeliveryAttempt(attempt.id, {
      status: "queued",
      processingAt: new Date(),
    });

    // 4. Resolve recipient
    const channelRecord = await ports.channels.findChannel(
      data.userId,
      data.channel,
    );

    if (!channelRecord || !channelRecord.isEnabled) {
      const errorMsg = channelRecord
        ? `Channel ${data.channel} is disabled for user`
        : `No ${data.channel} channel configured for user`;

      logger.warn(
        { jobId: job.id, channel: data.channel, userId: data.userId },
        errorMsg,
      );

      await ports.delivery.updateDeliveryAttempt(attempt.id, {
        status: "failed",
        failedAt: new Date(),
        errorType: "channel_not_configured",
        errorMessage: errorMsg,
        deliveryLatencyMs: Date.now() - startTime,
      });

      // Escalate to fallback
      await handleEscalation(data, prefs, ports.escalation);

      return {
        success: false,
        errorType: "channel_not_configured",
        errorMessage: errorMsg,
      };
    }

    // 5. Get adapter
    const adapter = ports.adapters.getAdapter(data.channel);
    if (!adapter) {
      const errorMsg = `No adapter registered for channel: ${data.channel}`;
      logger.error({ jobId: job.id, channel: data.channel }, errorMsg);

      await ports.delivery.updateDeliveryAttempt(attempt.id, {
        status: "failed",
        failedAt: new Date(),
        errorType: "adapter_not_found",
        errorMessage: errorMsg,
        deliveryLatencyMs: Date.now() - startTime,
      });

      return {
        success: false,
        errorType: "adapter_not_found",
        errorMessage: errorMsg,
      };
    }

    // 6. Render template
    const rendered = renderTemplate(
      data.channel,
      data.messageType,
      data.templateVars,
    );

    // 7. Send via adapter
    const sendResult = await adapter.send(
      channelRecord.channelIdentifier,
      rendered,
    );

    const latencyMs = Date.now() - startTime;

    if (sendResult.success) {
      // 8a. Success: update delivery attempt
      await ports.delivery.updateDeliveryAttempt(attempt.id, {
        status: "sent",
        sentAt: new Date(),
        providerMessageId: sendResult.providerMessageId,
        deliveryLatencyMs: latencyMs,
        costAmount: sendResult.costAmount,
        costCurrency: sendResult.costCurrency,
      });

      logger.info(
        {
          jobId: job.id,
          channel: data.channel,
          userId: data.userId,
          latencyMs,
          providerMessageId: sendResult.providerMessageId,
        },
        "Notification sent successfully",
      );

      return {
        success: true,
        providerMessageId: sendResult.providerMessageId,
        costAmount: sendResult.costAmount,
        costCurrency: sendResult.costCurrency,
      };
    }

    // 8b. Send failed
    await ports.delivery.updateDeliveryAttempt(attempt.id, {
      status: "failed",
      failedAt: new Date(),
      errorType: sendResult.errorType,
      errorMessage: sendResult.errorMessage,
      deliveryLatencyMs: latencyMs,
    });

    logger.warn(
      {
        jobId: job.id,
        channel: data.channel,
        userId: data.userId,
        error: sendResult.errorMessage,
        attemptsMade: job.attemptsMade,
      },
      "Notification send failed",
    );

    // Check if this was the final retry attempt
    const retryConfig = getRetryConfig(data.channel);
    if (job.attemptsMade >= retryConfig.maxAttempts - 1) {
      await handleEscalation(data, prefs, ports.escalation);
    }

    // Throw to trigger BullMQ retry
    throw new Error(
      `Send failed: ${sendResult.errorType}: ${sendResult.errorMessage}`,
    );
  } catch (error) {
    // If it's our own thrown error for retry, re-throw
    if (
      error instanceof Error &&
      error.message.startsWith("Send failed:")
    ) {
      throw error;
    }

    // Unexpected error
    const errorMsg =
      error instanceof Error ? error.message : "Unknown worker error";

    logger.error(
      {
        jobId: job.id,
        channel: data.channel,
        userId: data.userId,
        error: errorMsg,
      },
      "Unexpected worker error",
    );

    await ports.delivery.updateDeliveryAttempt(attempt.id, {
      status: "failed",
      failedAt: new Date(),
      errorType: "unexpected_error",
      errorMessage: errorMsg,
      deliveryLatencyMs: Date.now() - startTime,
    });

    throw error;
  }
}

// ── Escalation Handler ──────────────────────────────────────────────

async function handleEscalation(
  data: NotificationJobData,
  prefs: {
    readonly fallbackChain: string | null;
  } | undefined,
  escalation: WorkerEscalationPort,
): Promise<void> {
  if (!prefs?.fallbackChain) return;

  let chain: readonly string[];
  try {
    chain = JSON.parse(prefs.fallbackChain) as string[];
  } catch {
    return;
  }

  const currentIndex = chain.indexOf(data.channel);
  if (currentIndex < 0 || currentIndex >= chain.length - 1) return;

  const nextChannel = chain[currentIndex + 1];
  if (!nextChannel) return;

  const delayMs = 30_000; // 30s delay before escalation

  logger.info(
    {
      userId: data.userId,
      fromChannel: data.channel,
      toChannel: nextChannel,
      cascadeId: data.cascadeId,
    },
    "Escalating to next channel in fallback chain",
  );

  await escalation.enqueueEscalation(data, nextChannel, delayMs);
}

// ── Worker Initialization ───────────────────────────────────────────

export interface WorkerPorts {
  readonly adapters: WorkerAdapterPort;
  readonly channels: WorkerChannelPort;
  readonly delivery: WorkerDeliveryPort;
  readonly preferences: WorkerPreferencesPort;
  readonly quietHours: WorkerQuietHoursPort;
  readonly escalation: WorkerEscalationPort;
}

/**
 * Initializes one BullMQ Worker per channel queue.
 * Each worker reads from its dedicated queue and processes jobs
 * through the standard pipeline: quiet hours -> render -> send -> record.
 */
export function initializeWorkers(
  redisUrl: string,
  ports: WorkerPorts,
): ReadonlyMap<ChannelQueueName, Worker<NotificationJobData, ChannelWorkerResult>> {
  if (workers.size > 0) {
    return workers;
  }

  for (const [channelKey, queueName] of Object.entries(CHANNEL_QUEUES)) {
    const conn = createWorkerConnection(redisUrl, channelKey);

    const workerOptions: WorkerOptions = {
      connection: conn.connection,
      prefix: "unjynx",
      concurrency: channelKey === "push" ? 10 : 5,
      limiter:
        channelKey === "sms" || channelKey === "whatsapp"
          ? { max: 10, duration: 1_000 } // Rate limit paid channels
          : undefined,
    };

    const worker = new Worker<NotificationJobData, ChannelWorkerResult>(
      queueName,
      async (job) => processNotificationJob(job, ports),
      workerOptions,
    );

    worker.on("failed", (job, err) => {
      logger.error(
        {
          jobId: job?.id,
          queue: queueName,
          error: err.message,
          attemptsMade: job?.attemptsMade,
        },
        "Job failed",
      );
    });

    worker.on("completed", (job, result) => {
      if (result.success) {
        logger.debug(
          {
            jobId: job.id,
            queue: queueName,
            providerMessageId: result.providerMessageId,
          },
          "Job completed",
        );
      }
    });

    worker.on("error", (err) => {
      logger.error(
        { queue: queueName, error: err.message },
        "Worker error",
      );
    });

    workers.set(queueName as ChannelQueueName, worker);
  }

  return workers;
}

/**
 * Gracefully shuts down all workers.
 */
export async function closeAllWorkers(): Promise<void> {
  const closePromises = [...workers.values()].map((w) => w.close());
  await Promise.all(closePromises);
  workers.clear();
}

/**
 * Exposed for testing: clears the worker registry.
 */
export function resetWorkers(): void {
  workers.clear();
}
