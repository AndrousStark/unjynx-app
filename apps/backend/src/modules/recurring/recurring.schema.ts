import { z } from "zod";

/**
 * Validates an RFC 5545 RRULE string.
 * Must start with "FREQ=" and contain only valid RRULE characters.
 */
const rruleString = z
  .string()
  .min(1)
  .max(1000)
  .refine((val) => val.startsWith("FREQ=") || val.startsWith("RRULE:FREQ="), {
    message: "RRULE must start with FREQ= or RRULE:FREQ=",
  });

export const setRecurrenceSchema = z.object({
  rrule: rruleString,
});

export const occurrencesQuerySchema = z.object({
  count: z.coerce.number().int().min(1).max(100).default(5),
});

// ── Type Exports ───────────────────────────────────────────────────────

export type SetRecurrenceInput = z.infer<typeof setRecurrenceSchema>;
export type OccurrencesQuery = z.infer<typeof occurrencesQuerySchema>;
