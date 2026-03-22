import { z } from "zod";

export const connectSchema = z.object({
  authCode: z.string().min(1, "Authorization code is required"),
  provider: z.literal("google").default("google"),
});

export const eventsQuerySchema = z.object({
  start: z.coerce.date(),
  end: z.coerce.date(),
});

// ── Write-Back Schemas ───────────────────────────────────────────────

export const createCalendarEventSchema = z.object({
  taskId: z.string().uuid("taskId must be a valid UUID"),
  title: z.string().min(1).max(500),
  dueDate: z.coerce.date(),
  description: z.string().max(5000).optional(),
});

export const updateCalendarEventSchema = z.object({
  title: z.string().min(1).max(500).optional(),
  dueDate: z.coerce.date().optional(),
  description: z.string().max(5000).nullable().optional(),
});

// ── Type Exports ───────────────────────────────────────────────────────

export type ConnectInput = z.infer<typeof connectSchema>;
export type EventsQuery = z.infer<typeof eventsQuerySchema>;
export type CreateCalendarEventInput = z.infer<
  typeof createCalendarEventSchema
>;
export type UpdateCalendarEventInput = z.infer<
  typeof updateCalendarEventSchema
>;

export interface CalendarEvent {
  readonly id: string;
  readonly title: string;
  readonly description: string | null;
  readonly start: string; // ISO 8601
  readonly end: string; // ISO 8601
  readonly allDay: boolean;
  readonly location: string | null;
  readonly status: string; // confirmed, tentative, cancelled
  readonly htmlLink: string | null;
}

export interface CalendarStatus {
  readonly connected: boolean;
  readonly provider: string | null;
  readonly calendarId: string | null;
}
