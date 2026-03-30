// ── AI Pipeline Prometheus Metrics ────────────────────────────────────
//
// Exposes production-grade observability for the AI pipeline:
//   - Request counts by layer (intent/cache/llm) and status (hit/miss/error)
//   - Token consumption by model
//   - Cost tracking in USD
//   - Latency distributions (p50/p95/p99)
//   - Cache entry counts
//
// Scraped by Prometheus at /metrics, visualized in Grafana.

import {
  Registry,
  Counter,
  Gauge,
  Histogram,
  collectDefaultMetrics,
} from "prom-client";

// ── Custom Registry ───────────────────────────────────────────────

export const metricsRegistry = new Registry();
metricsRegistry.setDefaultLabels({ app: "unjynx-backend" });

// Collect default Node.js metrics (CPU, memory, event loop, GC)
collectDefaultMetrics({ register: metricsRegistry });

// ── Counters ──────────────────────────────────────────────────────

export const aiRequestsTotal = new Counter({
  name: "unjynx_ai_requests_total",
  help: "Total AI pipeline requests by layer and status",
  labelNames: ["layer", "status"] as const,
  registers: [metricsRegistry],
});

export const aiTokensTotal = new Counter({
  name: "unjynx_ai_tokens_total",
  help: "Total tokens consumed by model and direction",
  labelNames: ["model", "direction"] as const,
  registers: [metricsRegistry],
});

export const aiCostUsdTotal = new Counter({
  name: "unjynx_ai_cost_usd_total",
  help: "Estimated USD cost by model",
  labelNames: ["model"] as const,
  registers: [metricsRegistry],
});

export const aiCacheEvictionsTotal = new Counter({
  name: "unjynx_ai_cache_evictions_total",
  help: "Cache evictions by tier",
  labelNames: ["tier"] as const,
  registers: [metricsRegistry],
});

export const aiCorrectionsTotal = new Counter({
  name: "unjynx_ai_corrections_total",
  help: "Correction tracker operations by type",
  labelNames: ["type"] as const,
  registers: [metricsRegistry],
});

export const aiMemoryOpsTotal = new Counter({
  name: "unjynx_ai_memory_operations_total",
  help: "Working/semantic memory operations",
  labelNames: ["operation"] as const,
  registers: [metricsRegistry],
});

// ── Gauges ────────────────────────────────────────────────────────

export const aiCacheEntries = new Gauge({
  name: "unjynx_ai_cache_entries",
  help: "Current cache entry count by tier",
  labelNames: ["tier"] as const,
  registers: [metricsRegistry],
});

export const aiActiveSessions = new Gauge({
  name: "unjynx_ai_active_sessions",
  help: "Currently active AI chat sessions",
  registers: [metricsRegistry],
});

// ── Histograms ────────────────────────────────────────────────────

export const aiLatencySeconds = new Histogram({
  name: "unjynx_ai_latency_seconds",
  help: "AI pipeline latency distribution by layer",
  labelNames: ["layer"] as const,
  buckets: [0.005, 0.01, 0.05, 0.1, 0.25, 0.5, 1, 2.5, 5, 10],
  registers: [metricsRegistry],
});

export const aiTokensPerRequest = new Histogram({
  name: "unjynx_ai_tokens_per_request",
  help: "Token count distribution per request",
  labelNames: ["model"] as const,
  buckets: [50, 100, 500, 1000, 2000, 5000, 10000],
  registers: [metricsRegistry],
});

// ── Helper Functions ──────────────────────────────────────────────

/** Token cost rates (USD per token) */
const TOKEN_COSTS: Record<string, { input: number; output: number }> = {
  "claude-haiku-4-5-20241022": { input: 0.0000008, output: 0.000004 },
  "claude-sonnet-4-20250514": { input: 0.000003, output: 0.000015 },
  "claude-opus-4-20250514": { input: 0.000015, output: 0.000075 },
};

/**
 * Record a complete AI interaction with all relevant metrics.
 * Call this from the AI pipeline after every request completes.
 */
export function recordAiMetrics(data: {
  layer: "intent" | "cache" | "llm";
  status: "hit" | "miss" | "error";
  model?: string | null;
  tokensInput?: number;
  tokensOutput?: number;
  latencyMs: number;
}): void {
  // Request counter
  aiRequestsTotal.inc({ layer: data.layer, status: data.status });

  // Latency
  aiLatencySeconds.observe({ layer: data.layer }, data.latencyMs / 1000);
  aiLatencySeconds.observe({ layer: "total" }, data.latencyMs / 1000);

  // Token + cost tracking (only for LLM calls)
  if (data.model && data.tokensInput && data.tokensOutput) {
    const modelKey = data.model;

    aiTokensTotal.inc({ model: modelKey, direction: "input" }, data.tokensInput);
    aiTokensTotal.inc({ model: modelKey, direction: "output" }, data.tokensOutput);

    aiTokensPerRequest.observe(
      { model: modelKey },
      data.tokensInput + data.tokensOutput,
    );

    // Cost calculation
    const costs = TOKEN_COSTS[modelKey];
    if (costs) {
      const cost = data.tokensInput * costs.input + data.tokensOutput * costs.output;
      aiCostUsdTotal.inc({ model: modelKey }, cost);
    }
  }
}
