// ── Notification Dispatcher ──────────────────────────────────────────
// The main entry point for sending notifications. Takes job data from
// the scheduler, creates DB records, and enqueues to the appropriate
// BullMQ channel queue.

import type { Queue, Job } from "bullmq";
import type { NotificationJobData, ChannelQueueName } from "./types.js";
import { CHANNEL_QUEUES } from "./types.js";
import { getQueue } from "./queue-factory.js";
import pino from "pino";

const logger = pino({ name: "queue:dispatcher" });

// ── Port Interfaces ─────────────────────────────────────────────────

export interface DispatcherNotificationPort {
  insertNotification(data: {
    userId: string;
    taskId?: string;
    type: string;
    title: string;
    body: string;
    scheduledAt: Date;
    priority: number;
    cascadeId?: string;
    cascadeOrder?: number;
    metadata?: string;
  }): Promise<{ readonly id: string }>;
}

export interface DispatcherDeliveryPort {
  insertDeliveryAttempt(data: {
    notificationId: string;
    channel: string;
    provider: string;
    status: string;
    queuedAt: Date;
    bullmqJobId?: string;
  }): Promise<{ readonly id: string }>;
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

// ── Dispatch Result ─────────────────────────────────────────────────

export interface DispatchResult {
  readonly notificationId: string;
  readonly jobId: string | undefined;
  readonly queueName: ChannelQueueName;
}

// ── Single Job Dispatch ─────────────────────────────────────────────

/**
 * Dispatches a single notification job:
 * 1. Creates a Notification record in the database
 * 2. Creates a DeliveryAttempt record with status='queued'
 * 3. Adds the job to the appropriate channel queue
 *
 * Returns the notification ID and BullMQ job ID.
 */
export async function dispatchNotification(
  jobData: NotificationJobData,
  ports: {
    readonly notifications: DispatcherNotificationPort;
    readonly delivery: DispatcherDeliveryPort;
  },
  options?: {
    readonly delayMs?: number;
    readonly priority?: number;
  },
): Promise<DispatchResult> {
  const queueName = resolveQueueName(jobData.channel);

  // 1. Create notification record
  const notification = await ports.notifications.insertNotification({
    userId: jobData.userId,
    taskId: jobData.taskId,
    type: jobData.messageType,
    title: buildTitle(jobData),
    body: buildBody(jobData),
    scheduledAt: new Date(),
    priority: jobData.priority,
    cascadeId: jobData.cascadeId,
    cascadeOrder: jobData.attemptNumber - 1,
  });

  // Update job data with the real notification ID
  const enrichedData: NotificationJobData = {
    ...jobData,
    notificationId: notification.id,
  };

  // 2. Get the queue and add the job
  const queue = getQueue(queueName);
  const job = await queue.add(
    `${jobData.messageType}:${jobData.channel}`,
    enrichedData,
    {
      delay: options?.delayMs,
      priority: options?.priority ?? jobData.priority,
      jobId: `${notification.id}:${jobData.channel}:${Date.now()}`,
    },
  );

  // 3. Create delivery attempt record
  await ports.delivery.insertDeliveryAttempt({
    notificationId: notification.id,
    channel: jobData.channel,
    provider: CHANNEL_PROVIDER_MAP[jobData.channel] ?? "unknown",
    status: "queued",
    queuedAt: new Date(),
    bullmqJobId: job.id,
  });

  logger.info(
    {
      notificationId: notification.id,
      jobId: job.id,
      queue: queueName,
      channel: jobData.channel,
      userId: jobData.userId,
      delayMs: options?.delayMs,
    },
    "Notification dispatched",
  );

  return {
    notificationId: notification.id,
    jobId: job.id,
    queueName,
  };
}

// ── Cascade Dispatch ────────────────────────────────────────────────

/**
 * Dispatches a full cascade of notification jobs. Each step in the
 * cascade gets an increasing delay based on the cascade order.
 *
 * Jobs sharing the same cascadeId can be cancelled as a group
 * when the primary delivery succeeds.
 */
export async function dispatchCascade(
  jobs: readonly NotificationJobData[],
  ports: {
    readonly notifications: DispatcherNotificationPort;
    readonly delivery: DispatcherDeliveryPort;
  },
  baseDelayMs: number = 0,
  escalationStepMs: number = 300_000, // 5 minutes between cascade steps
): Promise<readonly DispatchResult[]> {
  const results: DispatchResult[] = [];

  for (let i = 0; i < jobs.length; i++) {
    const jobData = jobs[i];
    if (!jobData) continue;

    const delayMs = baseDelayMs + i * escalationStepMs;

    const result = await dispatchNotification(jobData, ports, {
      delayMs,
      priority: jobData.priority,
    });

    results.push(result);
  }

  logger.info(
    {
      cascadeId: jobs[0]?.cascadeId,
      steps: results.length,
      channels: jobs.map((j) => j.channel),
    },
    "Cascade dispatched",
  );

  return results;
}

// ── Escalation Enqueue ──────────────────────────────────────────────

/**
 * Enqueues an escalation job to the next channel in the fallback chain.
 * Used by workers when the current channel fails after all retries.
 */
export async function enqueueEscalation(
  originalJob: NotificationJobData,
  nextChannel: string,
  delayMs: number,
): Promise<string | undefined> {
  const queueName = resolveQueueName(nextChannel);
  const queue = getQueue(queueName);

  const escalationData: NotificationJobData = {
    ...originalJob,
    channel: nextChannel,
    attemptNumber: 1, // Reset attempts for new channel
  };

  const job = await queue.add(
    `escalation:${originalJob.messageType}:${nextChannel}`,
    escalationData,
    {
      delay: delayMs,
      priority: Math.max(1, originalJob.priority - 1), // Boost priority on escalation
      jobId: `esc:${originalJob.notificationId}:${nextChannel}:${Date.now()}`,
    },
  );

  logger.info(
    {
      originalChannel: originalJob.channel,
      nextChannel,
      notificationId: originalJob.notificationId,
      cascadeId: originalJob.cascadeId,
      jobId: job.id,
      delayMs,
    },
    "Escalation job enqueued",
  );

  return job.id;
}

// ── Helpers ─────────────────────────────────────────────────────────

function resolveQueueName(channel: string): ChannelQueueName {
  const queueName = CHANNEL_QUEUES[channel];
  if (!queueName) {
    throw new Error(`Unknown channel: ${channel}. No queue mapping found.`);
  }
  return queueName;
}

function buildTitle(job: NotificationJobData): string {
  const typeLabels: Readonly<Record<string, string>> = {
    task_reminder: "Task Reminder",
    overdue_alert: "Overdue Alert",
    streak_nudge: "Streak Nudge",
    daily_digest: "Daily Digest",
    daily_content: "Daily Inspiration",
  };
  return typeLabels[job.messageType] ?? "Notification";
}

function buildBody(job: NotificationJobData): string {
  const taskTitle = job.templateVars.task_title;
  if (taskTitle) {
    return `Notification for: ${taskTitle}`;
  }
  return `${buildTitle(job)} via ${job.channel}`;
}
