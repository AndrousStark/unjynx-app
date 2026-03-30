// ── Calendar Context for AI Pipeline ──────────────────────────────────
//
// Provides calendar-aware data to the AI context builder and planning service:
//   - Today's events (meetings, blocks)
//   - Available time slots (gaps between events)
//   - Back-to-back meeting warnings
//   - "Busy" time summary for LLM context injection
//
// Uses the existing calendar.service.ts for Google Calendar API access.
// Gracefully returns empty data if no calendar is connected.

import * as calendarService from "./calendar.service.js";
import { logger } from "../../middleware/logger.js";

const log = logger.child({ module: "calendar-context" });

// ── Types ──────────────────────────────────────────────────────────

export interface CalendarEvent {
  readonly id: string;
  readonly title: string;
  readonly start: string;          // ISO datetime or date
  readonly end: string;
  readonly allDay: boolean;
  readonly status: string;         // "confirmed" | "tentative" | "cancelled"
  readonly location: string | null;
}

export interface AvailableSlot {
  readonly startTime: string;      // "09:00"
  readonly endTime: string;        // "11:00"
  readonly durationMinutes: number;
  readonly type: "deep_work" | "focused_work" | "pomodoro_slot" | "quick_task";
}

export interface CalendarContext {
  readonly events: readonly CalendarEvent[];
  readonly availableSlots: readonly AvailableSlot[];
  readonly totalMeetingMinutes: number;
  readonly totalAvailableMinutes: number;
  readonly warnings: readonly string[];
  readonly hasCalendar: boolean;
}

// ── Constants ──────────────────────────────────────────────────────

const BUFFER_BEFORE_MEETING_MIN = 10;
const BUFFER_AFTER_MEETING_MIN = 15; // 23-min context switch research
const DEFAULT_WORK_START = 9;  // 9 AM
const DEFAULT_WORK_END = 18;   // 6 PM
const DEFAULT_LUNCH_START = 12.5; // 12:30 PM
const DEFAULT_LUNCH_END = 13.5;   // 1:30 PM

// ── Helpers ───────────────────────────────────────────────────────

function timeToMinutes(timeStr: string): number {
  const date = new Date(timeStr);
  return date.getHours() * 60 + date.getMinutes();
}

function minutesToTime(minutes: number): string {
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`;
}

function classifySlot(durationMinutes: number): AvailableSlot["type"] {
  if (durationMinutes >= 90) return "deep_work";
  if (durationMinutes >= 45) return "focused_work";
  if (durationMinutes >= 25) return "pomodoro_slot";
  return "quick_task";
}

// ── Public API ──────────────────────────────────────────────────────

/**
 * Fetch today's calendar context for a user.
 * Returns empty context if no calendar is connected (graceful degradation).
 */
export async function getTodayCalendarContext(
  userId: string,
  workStartHour: number = DEFAULT_WORK_START,
  workEndHour: number = DEFAULT_WORK_END,
): Promise<CalendarContext> {
  const emptyContext: CalendarContext = {
    events: [],
    availableSlots: [],
    totalMeetingMinutes: 0,
    totalAvailableMinutes: (workEndHour - workStartHour) * 60,
    warnings: [],
    hasCalendar: false,
  };

  try {
    const now = new Date();
    const todayStart = new Date(now);
    todayStart.setHours(0, 0, 0, 0);
    const todayEnd = new Date(now);
    todayEnd.setHours(23, 59, 59, 999);

    const rawEvents = await calendarService.getCalendarEvents(userId, todayStart, todayEnd);

    // Filter: only confirmed/tentative, non-all-day timed events
    const timedEvents = rawEvents
      .filter((e) => !e.allDay && e.status !== "cancelled")
      .map((e) => ({
        id: e.id,
        title: e.title,
        start: e.start,
        end: e.end,
        allDay: e.allDay,
        status: e.status,
        location: e.location,
      }))
      .sort((a, b) => new Date(a.start).getTime() - new Date(b.start).getTime());

    // Calculate meeting minutes
    const totalMeetingMinutes = timedEvents.reduce((sum, e) => {
      const startMin = timeToMinutes(e.start);
      const endMin = timeToMinutes(e.end);
      return sum + Math.max(0, endMin - startMin);
    }, 0);

    // Build buffered blocks (event + buffer before/after)
    const bufferedBlocks: { start: number; end: number }[] = timedEvents.map((e) => ({
      start: Math.max(workStartHour * 60, timeToMinutes(e.start) - BUFFER_BEFORE_MEETING_MIN),
      end: Math.min(workEndHour * 60, timeToMinutes(e.end) + BUFFER_AFTER_MEETING_MIN),
    }));

    // Merge overlapping blocks
    const merged: { start: number; end: number }[] = [];
    for (const block of bufferedBlocks) {
      if (merged.length > 0 && block.start <= merged[merged.length - 1].end) {
        // Immutable: replace last entry instead of mutating
        merged[merged.length - 1] = {
          start: merged[merged.length - 1].start,
          end: Math.max(merged[merged.length - 1].end, block.end),
        };
      } else {
        merged.push({ ...block });
      }
    }

    // Add lunch block
    const lunchStart = DEFAULT_LUNCH_START * 60;
    const lunchEnd = DEFAULT_LUNCH_END * 60;

    // Find gaps (available slots)
    const workStart = workStartHour * 60;
    const workEnd = workEndHour * 60;
    const allBlocks = [...merged, { start: lunchStart, end: lunchEnd }]
      .sort((a, b) => a.start - b.start);

    // Merge again after adding lunch
    const finalBlocked: { start: number; end: number }[] = [];
    for (const block of allBlocks) {
      if (finalBlocked.length > 0 && block.start <= finalBlocked[finalBlocked.length - 1].end) {
        finalBlocked[finalBlocked.length - 1] = {
          start: finalBlocked[finalBlocked.length - 1].start,
          end: Math.max(finalBlocked[finalBlocked.length - 1].end, block.end),
        };
      } else {
        finalBlocked.push({ ...block });
      }
    }

    const availableSlots: AvailableSlot[] = [];
    let cursor = workStart;

    for (const block of finalBlocked) {
      if (block.start > cursor) {
        const duration = block.start - cursor;
        if (duration >= 10) { // Minimum 10 minutes to be useful
          availableSlots.push({
            startTime: minutesToTime(cursor),
            endTime: minutesToTime(block.start),
            durationMinutes: duration,
            type: classifySlot(duration),
          });
        }
      }
      cursor = Math.max(cursor, block.end);
    }

    // Final gap after last block until work end
    if (cursor < workEnd) {
      const duration = workEnd - cursor;
      if (duration >= 10) {
        availableSlots.push({
          startTime: minutesToTime(cursor),
          endTime: minutesToTime(workEnd),
          durationMinutes: duration,
          type: classifySlot(duration),
        });
      }
    }

    const totalAvailableMinutes = availableSlots.reduce((s, slot) => s + slot.durationMinutes, 0);

    // Detect warnings
    const warnings: string[] = [];

    // Back-to-back meetings (emit ONE warning for the worst streak)
    let consecutiveCount = 1;
    let maxConsecutive = 1;
    for (let i = 1; i < timedEvents.length; i++) {
      const gap = timeToMinutes(timedEvents[i].start) - timeToMinutes(timedEvents[i - 1].end);
      if (gap < 15) {
        consecutiveCount++;
        maxConsecutive = Math.max(maxConsecutive, consecutiveCount);
      } else {
        consecutiveCount = 1;
      }
    }
    if (maxConsecutive >= 3) {
      warnings.push(`${maxConsecutive} consecutive meetings with no breaks.`);
    }

    // Heavy meeting day
    if (totalMeetingMinutes > 300) {
      warnings.push(`Heavy meeting day: ${Math.round(totalMeetingMinutes / 60)}h of meetings.`);
    }

    // Low available time
    if (totalAvailableMinutes < 120) {
      warnings.push(`Only ${totalAvailableMinutes}min of focus time available today.`);
    }

    return {
      events: timedEvents,
      availableSlots,
      totalMeetingMinutes,
      totalAvailableMinutes,
      warnings,
      hasCalendar: true,
    };
  } catch (error) {
    // Calendar not connected or API error — graceful degradation
    if (error instanceof calendarService.CalendarNotConnectedError) {
      return emptyContext;
    }
    log.warn({ error, userId }, "Calendar fetch failed — using empty context");
    return emptyContext;
  }
}

/**
 * Serialize calendar context for LLM injection (~40-60 tokens).
 */
export function serializeCalendarContext(ctx: CalendarContext): string {
  if (!ctx.hasCalendar || ctx.events.length === 0) return "";

  const parts: string[] = [];

  // Meeting summary
  if (ctx.events.length > 0) {
    const meetingList = ctx.events
      .slice(0, 5) // Top 5 meetings
      .map((e) => {
        const startTime = new Date(e.start).toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" });
        return `${startTime} ${e.title}`;
      })
      .join(", ");
    parts.push(`Meetings: ${meetingList}`);
  }

  // Available time
  parts.push(`Free time: ${ctx.totalAvailableMinutes}min in ${ctx.availableSlots.length} slots`);

  // Deep work slots
  const deepSlots = ctx.availableSlots.filter((s) => s.type === "deep_work");
  if (deepSlots.length > 0) {
    parts.push(`Deep work: ${deepSlots.map((s) => `${s.startTime}-${s.endTime}`).join(", ")}`);
  }

  // Warnings
  if (ctx.warnings.length > 0) {
    parts.push(`⚠ ${ctx.warnings[0]}`);
  }

  return `Calendar: ${parts.join(". ")}`;
}
