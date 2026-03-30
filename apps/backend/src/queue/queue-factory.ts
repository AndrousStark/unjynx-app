// ── Queue Factory ────────────────────────────────────────────────────
// Creates real BullMQ Queue instances for each notification channel.
// Each queue is keyed by its ChannelQueueName and shares the same
// producer Redis connection.

import { Queue } from "bullmq";
import type { QueueOptions, JobsOptions } from "bullmq";
import type { QueueConnectionPort } from "./connection.js";
import type { ChannelQueueName, NotificationJobData } from "./types.js";
import { CHANNEL_QUEUES } from "./types.js";
import { getRetryConfig } from "./retry-policy.js";

// ── Queue Registry ──────────────────────────────────────────────────

const queues = new Map<ChannelQueueName, Queue<NotificationJobData>>();

// ── Default Job Options ─────────────────────────────────────────────

function buildDefaultJobOptions(channel: string): JobsOptions {
  const retryConfig = getRetryConfig(channel);

  return {
    attempts: retryConfig.maxAttempts,
    backoff: {
      type: "exponential",
      delay: retryConfig.baseDelayMs,
    },
    removeOnComplete: {
      age: 86_400,   // 24 hours
      count: 1_000,
    },
    removeOnFail: {
      age: 604_800,  // 7 days
    },
  };
}

// ── Queue Creation ──────────────────────────────────────────────────

function createQueue(
  queueName: ChannelQueueName,
  channelKey: string,
  connection: QueueConnectionPort,
): Queue<NotificationJobData> {
  const queueOptions: QueueOptions = {
    connection: connection.connection as QueueOptions["connection"],
    defaultJobOptions: buildDefaultJobOptions(channelKey),
    prefix: "unjynx",
  };

  return new Queue<NotificationJobData>(queueName, queueOptions);
}

// ── Public API ──────────────────────────────────────────────────────

/**
 * Initializes all notification channel queues using the provided
 * producer connection. Safe to call multiple times; subsequent
 * calls are no-ops.
 */
export function initializeQueues(
  connection: QueueConnectionPort,
): ReadonlyMap<ChannelQueueName, Queue<NotificationJobData>> {
  if (queues.size > 0) {
    return queues;
  }

  for (const [channelKey, queueName] of Object.entries(CHANNEL_QUEUES)) {
    const queue = createQueue(
      queueName as ChannelQueueName,
      channelKey,
      connection,
    );
    queues.set(queueName as ChannelQueueName, queue);
  }

  return queues;
}

/**
 * Returns the BullMQ Queue for the given channel queue name.
 * Throws if queues have not been initialized yet.
 */
export function getQueue(
  queueName: ChannelQueueName,
): Queue<NotificationJobData> {
  const queue = queues.get(queueName);
  if (!queue) {
    throw new Error(
      `Queue "${queueName}" not found. Call initializeQueues() first.`,
    );
  }
  return queue;
}

/**
 * Returns all initialized queues as a read-only map.
 */
export function getAllQueues(): ReadonlyMap<
  ChannelQueueName,
  Queue<NotificationJobData>
> {
  return queues;
}

/**
 * Gracefully closes all queues. Call during application shutdown.
 */
export async function closeAllQueues(): Promise<void> {
  const closePromises = [...queues.values()].map((q) => q.close());
  await Promise.all(closePromises);
  queues.clear();
}

/**
 * Exposed for testing: clears the queue registry without closing
 * the underlying connections.
 */
export function resetQueues(): void {
  queues.clear();
}
