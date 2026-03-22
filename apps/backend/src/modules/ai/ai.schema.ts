import { z } from "zod";

// ── Request Schemas ─────────────────────────────────────────────────────

export const suggestionsQuerySchema = z.object({
  limit: z.coerce.number().int().min(1).max(50).default(10),
  hour: z.coerce.number().min(0).max(23).optional(),
  day: z.coerce.number().min(0).max(6).optional(),
  energy: z.coerce.number().min(1).max(5).optional(),
});

export const patternsQuerySchema = z.object({
  days: z.coerce.number().int().min(7).max(365).default(90),
});

// ── Response Types (read-only) ──────────────────────────────────────────

export interface SlotInfo {
  readonly slot: number;
  readonly mean: number;
  readonly confidence: number;
  readonly observations: number;
}

export interface OptimalTimeResult {
  readonly optimalSlot: number;
  readonly optimalHour: string;
  readonly topSlots: readonly SlotInfo[];
  readonly distribution: readonly SlotInfo[];
  readonly dataPoints: number;
}

export interface RankedTask {
  readonly taskId: string;
  readonly score: number;
  readonly rank: number;
}

export interface SuggestionsResult {
  readonly rankedTasks: readonly RankedTask[];
  readonly modelInfo: {
    readonly arms: number;
    readonly historyPoints: number;
  };
}

export interface EnergyHour {
  readonly hour: number;
  readonly energy: number;
  readonly confidence: number;
  readonly std: number;
}

export interface EnergyResult {
  readonly forecast: readonly EnergyHour[];
  readonly peakHours: readonly EnergyHour[];
  readonly lowHours: readonly EnergyHour[];
  readonly dataPoints: number;
}

export interface Pattern {
  readonly type: string;
  readonly description: string;
  readonly confidence: number;
  readonly [key: string]: unknown;
}

export interface ForecastDay {
  readonly date: string;
  readonly predicted: number;
  readonly lower: number;
  readonly upper: number;
}

export interface PatternsResult {
  readonly patterns: readonly Pattern[];
  readonly forecast: readonly ForecastDay[];
  readonly dataPoints: number;
}

// ── Type Exports ────────────────────────────────────────────────────────

export type SuggestionsQuery = z.infer<typeof suggestionsQuerySchema>;
export type PatternsQuery = z.infer<typeof patternsQuerySchema>;
