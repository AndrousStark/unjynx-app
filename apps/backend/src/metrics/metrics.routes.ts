// ── Prometheus Metrics Endpoint ───────────────────────────────────────
//
// GET /metrics — Prometheus-compatible metrics scrape endpoint.
// Exposes AI pipeline metrics + default Node.js metrics.
// No auth required — Prometheus scrapes this from the internal network.

import { Hono } from "hono";
import { metricsRegistry } from "./ai-metrics.js";

export const metricsRoutes = new Hono();

metricsRoutes.get("/", async (c) => {
  const metrics = await metricsRegistry.metrics();
  return c.text(metrics, 200, {
    "Content-Type": metricsRegistry.contentType,
  });
});
