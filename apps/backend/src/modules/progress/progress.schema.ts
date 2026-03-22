import { z } from "zod";

// ── Heatmap Query ────────────────────────────────────────────────────

export const heatmapQuerySchema = z.object({
  startDate: z.coerce.date().optional(),
  endDate: z.coerce.date().optional(),
});

// ── Completion Trend Query ────────────────────────────────────────────

export const completionTrendQuerySchema = z.object({
  days: z.coerce.number().int().min(1).max(365).optional().default(30),
});

// ── Snapshot (no input - auto-calculated) ────────────────────────────

export const snapshotSchema = z.object({});

// ── Type Exports ─────────────────────────────────────────────────────

export type HeatmapQuery = z.infer<typeof heatmapQuerySchema>;
export type CompletionTrendQuery = z.infer<typeof completionTrendQuerySchema>;
