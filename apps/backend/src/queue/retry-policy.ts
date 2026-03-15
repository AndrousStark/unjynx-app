// ── Retry Configuration ───────────────────────────────────────────────

export interface RetryConfig {
  readonly maxAttempts: number;
  readonly baseDelayMs: number;
  readonly maxDelayMs: number;
}

const DEFAULT_RETRY: RetryConfig = {
  maxAttempts: 3,
  baseDelayMs: 1000,
  maxDelayMs: 30000,
};

// ── Per-Channel Overrides ─────────────────────────────────────────────

export const CHANNEL_RETRY_CONFIG: Readonly<Record<string, RetryConfig>> = {
  push: { maxAttempts: 3, baseDelayMs: 500, maxDelayMs: 10000 },
  telegram: { maxAttempts: 3, baseDelayMs: 1000, maxDelayMs: 30000 },
  email: { maxAttempts: 3, baseDelayMs: 2000, maxDelayMs: 60000 },
  whatsapp: { maxAttempts: 2, baseDelayMs: 3000, maxDelayMs: 30000 },
  sms: { maxAttempts: 2, baseDelayMs: 5000, maxDelayMs: 60000 },
  instagram: { maxAttempts: 2, baseDelayMs: 3000, maxDelayMs: 30000 },
  slack: { maxAttempts: 3, baseDelayMs: 1000, maxDelayMs: 15000 },
  discord: { maxAttempts: 3, baseDelayMs: 1000, maxDelayMs: 15000 },
};

// ── Backoff Calculator ────────────────────────────────────────────────

/**
 * Calculates exponential backoff with jitter.
 * delay = min(maxDelayMs, baseDelayMs * 2^attempt) + random(0, baseDelayMs)
 */
export function calculateBackoff(
  attempt: number,
  config: RetryConfig = DEFAULT_RETRY,
): number {
  const exponentialDelay = config.baseDelayMs * Math.pow(2, attempt);
  const cappedDelay = Math.min(config.maxDelayMs, exponentialDelay);
  const jitter = Math.random() * config.baseDelayMs;
  return Math.floor(cappedDelay + jitter);
}

// ── Config Lookup ─────────────────────────────────────────────────────

/**
 * Returns the retry config for a given channel,
 * falling back to the default config for unknown channels.
 */
export function getRetryConfig(channel: string): RetryConfig {
  return CHANNEL_RETRY_CONFIG[channel] ?? DEFAULT_RETRY;
}

// ── BullMQ-Compatible Backoff Options ───────────────────────────────

export interface BullMQBackoffOptions {
  readonly type: "exponential" | "fixed";
  readonly delay: number;
}

/**
 * Returns BullMQ-compatible backoff configuration for a given channel.
 * Use this when setting job-level backoff overrides.
 */
export function getBullMQBackoff(channel: string): BullMQBackoffOptions {
  const config = getRetryConfig(channel);
  return {
    type: "exponential",
    delay: config.baseDelayMs,
  };
}

/**
 * Returns a full BullMQ job options object for a given channel,
 * including attempts, backoff, and cleanup settings.
 */
export function getBullMQJobOptions(channel: string): {
  readonly attempts: number;
  readonly backoff: BullMQBackoffOptions;
  readonly removeOnComplete: { readonly age: number; readonly count: number };
  readonly removeOnFail: { readonly age: number };
} {
  const config = getRetryConfig(channel);
  return {
    attempts: config.maxAttempts,
    backoff: {
      type: "exponential",
      delay: config.baseDelayMs,
    },
    removeOnComplete: { age: 86_400, count: 1_000 },
    removeOnFail: { age: 604_800 },
  };
}
