// ── Queue Connection Factory ─────────────────────────────────────────
// Creates IORedis connections for BullMQ producers (Queue) and
// consumers (Worker). BullMQ requires separate connections for each.

import IORedis from "ioredis";
import type { RedisOptions } from "ioredis";

// ── Port Interface ──────────────────────────────────────────────────

export interface QueueConnectionPort {
  readonly connection: IORedis;
  close(): Promise<void>;
}

// ── Default Redis Options ───────────────────────────────────────────

const BASE_REDIS_OPTIONS: Readonly<RedisOptions> = {
  maxRetriesPerRequest: null, // Required by BullMQ
  enableReadyCheck: false,
  retryStrategy(times: number): number | null {
    // Exponential backoff: 50ms, 100ms, 200ms ... capped at 5s
    const delay = Math.min(times * 50, 5000);
    return delay;
  },
  reconnectOnError(err: Error): boolean {
    // Reconnect on READONLY errors (e.g., failover)
    return err.message.includes("READONLY");
  },
};

// ── Connection Factory ──────────────────────────────────────────────

function buildConnection(
  redisUrl: string,
  name: string,
): QueueConnectionPort {
  const client = new IORedis(redisUrl, {
    ...BASE_REDIS_OPTIONS,
    connectionName: `unjynx:${name}`,
    lazyConnect: true,
  });

  return {
    connection: client,
    async close(): Promise<void> {
      if (client.status !== "end") {
        await client.quit();
      }
    },
  };
}

/**
 * Creates a Redis connection for BullMQ Queue producers.
 * Queue producers share a single connection for enqueuing jobs.
 */
export function createProducerConnection(
  redisUrl: string,
): QueueConnectionPort {
  return buildConnection(redisUrl, "producer");
}

/**
 * Creates a Redis connection for BullMQ Worker consumers.
 * Each worker requires its own dedicated connection.
 */
export function createWorkerConnection(
  redisUrl: string,
  channel: string,
): QueueConnectionPort {
  return buildConnection(redisUrl, `worker:${channel}`);
}

// ── In-Memory Stub (test) ───────────────────────────────────────────

export function createInMemoryQueueConnection(): QueueConnectionPort {
  // Return a stub that satisfies the interface for unit tests
  // that do not need a real Redis connection.
  const stub = {
    status: "ready",
    quit: async () => "OK" as const,
  } as unknown as IORedis;

  return {
    connection: stub,
    async close(): Promise<void> {
      // noop
    },
  };
}
