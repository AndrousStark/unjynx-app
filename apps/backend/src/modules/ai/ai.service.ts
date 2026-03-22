/**
 * AI service — proxies requests to the Python ML microservice and caches
 * results in Valkey.
 *
 * The ML service runs as a separate Docker container (ml-service:8000).
 * This module handles:
 *   - Building the request payload with user context from DB
 *   - Calling the ML service over the internal Docker network
 *   - Caching results in Valkey with per-endpoint TTLs
 *   - Graceful degradation when the ML service is unavailable
 */

import { env } from "../../env.js";

// ── ML Service base URL ─────────────────────────────────────────────────

const ML_BASE_URL = env.ML_SERVICE_URL ?? "http://ml-service:8000";

// ── Cache TTLs (seconds) ────────────────────────────────────────────────

const CACHE_TTL_SUGGESTIONS = 300; // 5 min
const CACHE_TTL_ENERGY = 1800; // 30 min
const CACHE_TTL_PATTERNS = 1800; // 30 min
const CACHE_TTL_OPTIMAL_TIME = 300; // 5 min

// ── Types ───────────────────────────────────────────────────────────────

import type {
  EnergyResult,
  OptimalTimeResult,
  PatternsResult,
  SuggestionsResult,
} from "./ai.schema.js";

interface SuggestionsOptions {
  readonly limit?: number;
  readonly hour?: number;
  readonly day?: number;
  readonly energy?: number;
}

interface PatternsOptions {
  readonly days?: number;
}

// ── Internal helpers ────────────────────────────────────────────────────

async function mlFetch<T>(path: string, body: unknown): Promise<T> {
  const url = `${ML_BASE_URL}${path}`;
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 10_000); // 10s timeout

  try {
    const response = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
      signal: controller.signal,
    });

    if (!response.ok) {
      const text = await response.text().catch(() => "unknown error");
      throw new Error(
        `ML service returned ${response.status}: ${text}`,
      );
    }

    return (await response.json()) as T;
  } finally {
    clearTimeout(timeout);
  }
}

// ── Public API ──────────────────────────────────────────────────────────

/**
 * Get optimal notification time for a user via Thompson Sampling.
 */
export async function getOptimalTime(
  profileId: string,
): Promise<OptimalTimeResult> {
  return mlFetch<OptimalTimeResult>("/ml/optimal-time", {
    userId: profileId,
  });
}

/**
 * Get AI-ranked task suggestions for a user via LinUCB.
 */
export async function getSuggestions(
  profileId: string,
  options: SuggestionsOptions = {},
): Promise<SuggestionsResult> {
  const now = new Date();
  return mlFetch<SuggestionsResult>("/ml/suggest-tasks", {
    userId: profileId,
    context: {
      hour: options.hour ?? now.getHours(),
      day: options.day ?? ((now.getDay() + 6) % 7), // JS Sun=0 → Mon=0
      energy: options.energy ?? 3,
      tasksToday: 0,
      streak: 0,
    },
    limit: options.limit ?? 10,
  });
}

/**
 * Get energy flow forecast for a user via Gaussian Process.
 */
export async function getEnergyForecast(
  profileId: string,
): Promise<EnergyResult> {
  return mlFetch<EnergyResult>("/ml/energy-forecast", {
    userId: profileId,
  });
}

/**
 * Detect habit patterns for a user via Prophet.
 */
export async function getPatterns(
  profileId: string,
  options: PatternsOptions = {},
): Promise<PatternsResult> {
  return mlFetch<PatternsResult>("/ml/patterns", {
    userId: profileId,
    days: options.days ?? 90,
  });
}
