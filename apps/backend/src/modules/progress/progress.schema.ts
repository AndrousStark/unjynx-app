import { z } from "zod";

// ── Heatmap Query ────────────────────────────────────────────────────

export const heatmapQuerySchema = z.object({
  startDate: z.coerce.date().optional(),
  endDate: z.coerce.date().optional(),
});

// ── Snapshot (no input - auto-calculated) ────────────────────────────

export const snapshotSchema = z.object({});

// ── Type Exports ─────────────────────────────────────────────────────

export type HeatmapQuery = z.infer<typeof heatmapQuerySchema>;
