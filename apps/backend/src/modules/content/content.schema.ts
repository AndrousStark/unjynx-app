import { z } from "zod";

// ── Content Category Values (mirrors DB enum) ───────────────────────
const contentCategoryValues = [
  "stoic_wisdom",
  "ancient_indian",
  "growth_mindset",
  "dark_humor",
  "anime",
  "gratitude",
  "warrior_discipline",
  "poetry",
  "productivity_hacks",
  "comeback_stories",
] as const;

// ── Content Queries ──────────────────────────────────────────────────

export const contentTodayQuerySchema = z.object({
  category: z.enum(contentCategoryValues).optional(),
});

export const saveContentSchema = z.object({
  contentId: z.string().uuid(),
});

export const updatePrefsSchema = z.object({
  categories: z
    .array(z.enum(contentCategoryValues))
    .min(1)
    .max(10),
  deliveryTime: z
    .string()
    .regex(/^([01]\d|2[0-3]):[0-5]\d$/, "Must be HH:mm format")
    .default("07:00")
    .optional(),
});

// ── Ritual Schemas ───────────────────────────────────────────────────

export const logRitualSchema = z.object({
  ritualType: z.enum(["morning", "evening"]),
  mood: z.number().int().min(1).max(5).optional(),
  gratitude: z.string().max(2000).optional(),
  intention: z.string().max(2000).optional(),
  reflection: z.string().max(2000).optional(),
});

export const ritualHistorySchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
});

// ── Type Exports ─────────────────────────────────────────────────────

export type ContentTodayQuery = z.infer<typeof contentTodayQuerySchema>;
export type SaveContentInput = z.infer<typeof saveContentSchema>;
export type UpdatePrefsInput = z.infer<typeof updatePrefsSchema>;
export type LogRitualInput = z.infer<typeof logRitualSchema>;
export type RitualHistoryQuery = z.infer<typeof ritualHistorySchema>;
