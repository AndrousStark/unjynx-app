// ── CalDAV Provider ─────────────────────────────────────────────────
// Implements CalDAV protocol support (Apple iCloud, Fastmail, Nextcloud, etc.)
// using the tsdav library. Credentials are stored in calendarTokens with
// provider='apple'. Apple users need an app-specific password generated
// from https://appleid.apple.com.

import { DAVClient } from "tsdav";
import { eq, and } from "drizzle-orm";
import { db } from "../../../db/index.js";
import {
  calendarTokens,
  calendarEventMapping,
} from "../../../db/schema/index.js";
import type {
  CalendarEvent,
  CreateCalendarEventInput,
  UpdateCalendarEventInput,
} from "../calendar.schema.js";
import type {
  CalendarToken,
  CalendarEventMapping,
} from "../../../db/schema/index.js";
import { logger } from "../../../middleware/logger.js";

const log = logger.child({ module: "caldav-provider" });

// ── Constants ────────────────────────────────────────────────────────

const ICLOUD_CALDAV_URL = "https://caldav.icloud.com";
const PROVIDER_NAME = "apple";

// ── Helpers ──────────────────────────────────────────────────────────

/**
 * Build a tsdav DAVClient from stored credentials.
 * CalDAV credentials are stored as: accessToken = username, refreshToken = password.
 * This mapping avoids adding new DB columns while remaining clear in context.
 */
function buildDAVClient(tokenRow: CalendarToken): DAVClient {
  return new DAVClient({
    serverUrl: tokenRow.calendarId ?? ICLOUD_CALDAV_URL,
    credentials: {
      username: tokenRow.accessToken,
      password: tokenRow.refreshToken,
    },
    authMethod: "Basic",
    defaultAccountType: "caldav",
  });
}

/**
 * Load CalDAV tokens for a user. Returns null if not connected.
 */
async function loadCalDAVTokens(
  userId: string,
): Promise<CalendarToken | null> {
  const [row] = await db
    .select()
    .from(calendarTokens)
    .where(
      and(
        eq(calendarTokens.userId, userId),
        eq(calendarTokens.provider, PROVIDER_NAME),
      ),
    )
    .limit(1);

  return row ?? null;
}

/**
 * Format a Date to iCalendar DTSTART/DTEND format (UTC).
 */
function toICalTimestamp(date: Date): string {
  return date.toISOString().replace(/[-:]/g, "").split(".")[0] + "Z";
}

/**
 * Parse VEVENT properties from raw iCalendar data.
 * Returns a partial CalendarEvent object.
 */
function parseVEvent(
  calendarData: string,
  url: string,
): CalendarEvent | null {
  const veventMatch = calendarData.match(
    /BEGIN:VEVENT[\s\S]*?END:VEVENT/,
  );
  if (!veventMatch) return null;

  const vevent = veventMatch[0];

  const getProp = (name: string): string | null => {
    // Handle properties with parameters (e.g., DTSTART;TZID=...)
    const regex = new RegExp(`^${name}[;:](.*)$`, "m");
    const match = vevent.match(regex);
    if (!match) return null;
    // If the line has parameters (semicolon before colon), extract value after last colon
    const raw = match[1];
    const colonIdx = raw.indexOf(":");
    return colonIdx >= 0 ? raw.substring(colonIdx + 1).trim() : raw.trim();
  };

  const uid = getProp("UID") ?? url;
  const summary = getProp("SUMMARY") ?? "(No title)";
  const description = getProp("DESCRIPTION") ?? null;
  const location = getProp("LOCATION") ?? null;
  const status = getProp("STATUS") ?? "CONFIRMED";

  const dtstart = getProp("DTSTART");
  const dtend = getProp("DTEND");

  // Check if all-day event (DATE vs DATETIME)
  const isAllDay =
    dtstart !== null && dtstart.length === 8; // YYYYMMDD format

  const parseICalDate = (val: string | null): string => {
    if (!val) return new Date().toISOString();
    // YYYYMMDD format (all-day)
    if (val.length === 8) {
      return `${val.slice(0, 4)}-${val.slice(4, 6)}-${val.slice(6, 8)}`;
    }
    // YYYYMMDDTHHmmssZ or YYYYMMDDTHHmmss format
    const cleaned = val.replace(/Z$/, "");
    if (cleaned.length >= 15) {
      const y = cleaned.slice(0, 4);
      const m = cleaned.slice(4, 6);
      const d = cleaned.slice(6, 8);
      const h = cleaned.slice(9, 11);
      const min = cleaned.slice(11, 13);
      const s = cleaned.slice(13, 15);
      return `${y}-${m}-${d}T${h}:${min}:${s}${val.endsWith("Z") ? "Z" : ""}`;
    }
    return val;
  };

  return {
    id: uid,
    title: summary,
    description,
    start: parseICalDate(dtstart),
    end: parseICalDate(dtend),
    allDay: isAllDay,
    location,
    status: status.toLowerCase(),
    htmlLink: null,
  };
}

// ── Public API ───────────────────────────────────────────────────────

/**
 * Test connection to a CalDAV server and store credentials.
 * Uses the CalDAV URL, username (Apple ID email), and app-specific password.
 */
export async function connectCalDAV(
  userId: string,
  caldavUrl: string,
  username: string,
  password: string,
): Promise<{
  readonly connected: boolean;
  readonly provider: string;
  readonly calendarId: string;
}> {
  // Validate connection by attempting login + calendar fetch
  const client = new DAVClient({
    serverUrl: caldavUrl,
    credentials: { username, password },
    authMethod: "Basic",
    defaultAccountType: "caldav",
  });

  try {
    await client.login();
    const calendars = await client.fetchCalendars();

    if (calendars.length === 0) {
      throw new Error(
        "No calendars found on the CalDAV server. Check your credentials and permissions.",
      );
    }

    log.info(
      { userId, server: caldavUrl, calendarCount: calendars.length },
      "CalDAV connection validated",
    );
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Unknown CalDAV error";

    log.warn(
      { userId, server: caldavUrl, error: message },
      "CalDAV connection failed",
    );

    throw new Error(
      `CalDAV connection failed: ${message}. ` +
        "For iCloud, ensure you are using an app-specific password " +
        "(generate one at https://appleid.apple.com/account/manage).",
    );
  }

  // Store credentials: accessToken = username, refreshToken = password
  // calendarId stores the CalDAV server URL for reconnection
  const now = new Date();
  const farFuture = new Date(now.getTime() + 365 * 24 * 60 * 60_000);

  const values = {
    userId,
    provider: PROVIDER_NAME,
    accessToken: username,
    refreshToken: password,
    expiresAt: farFuture, // CalDAV credentials don't expire (password-based)
    calendarId: caldavUrl,
    updatedAt: now,
  };

  await db
    .insert(calendarTokens)
    .values(values)
    .onConflictDoUpdate({
      target: [calendarTokens.userId, calendarTokens.provider],
      set: {
        accessToken: values.accessToken,
        refreshToken: values.refreshToken,
        expiresAt: values.expiresAt,
        calendarId: values.calendarId,
        updatedAt: values.updatedAt,
      },
    });

  return {
    connected: true,
    provider: PROVIDER_NAME,
    calendarId: caldavUrl,
  };
}

/**
 * Fetch CalDAV calendar events within a date range.
 * Parses VEVENT objects and converts to CalendarEvent format.
 */
export async function getCalDAVEvents(
  userId: string,
  start: Date,
  end: Date,
): Promise<readonly CalendarEvent[]> {
  const tokenRow = await loadCalDAVTokens(userId);
  if (!tokenRow) return [];

  const client = buildDAVClient(tokenRow);

  try {
    await client.login();
    const calendars = await client.fetchCalendars();

    if (calendars.length === 0) return [];

    const allEvents: CalendarEvent[] = [];

    for (const calendar of calendars) {
      try {
        const objects = await client.fetchCalendarObjects({
          calendar,
          timeRange: {
            start: start.toISOString(),
            end: end.toISOString(),
          },
        });

        for (const obj of objects) {
          if (!obj.data) continue;
          const parsed = parseVEvent(obj.data, obj.url);
          if (parsed) {
            allEvents.push(parsed);
          }
        }
      } catch (calError) {
        log.warn(
          {
            userId,
            calendarUrl: calendar.url,
            error:
              calError instanceof Error
                ? calError.message
                : "Unknown error",
          },
          "Failed to fetch objects from calendar",
        );
      }
    }

    return allEvents;
  } catch (error) {
    log.error(
      {
        userId,
        error:
          error instanceof Error ? error.message : "Unknown CalDAV error",
      },
      "CalDAV getEvents failed",
    );

    throw new CalDAVConnectionError(
      error instanceof Error
        ? error.message
        : "Failed to connect to CalDAV server",
    );
  }
}

/**
 * Create a VEVENT on the CalDAV server for a task and store the mapping.
 * Returns the mapping row, or null if user has no CalDAV connected.
 */
export async function createCalDAVEvent(
  userId: string,
  input: CreateCalendarEventInput,
): Promise<CalendarEventMapping | null> {
  const tokenRow = await loadCalDAVTokens(userId);
  if (!tokenRow) return null;

  const client = buildDAVClient(tokenRow);

  try {
    await client.login();
    const calendars = await client.fetchCalendars();

    if (calendars.length === 0) {
      throw new Error("No calendars available on CalDAV server");
    }

    // Use the first calendar (primary)
    const calendar = calendars[0];

    const eventUID = `unjynx-${input.taskId}@unjynx.me`;
    const now = new Date();
    const startDateTime = new Date(input.dueDate);
    const endDateTime = new Date(startDateTime.getTime() + 30 * 60_000);

    const iCalString = [
      "BEGIN:VCALENDAR",
      "VERSION:2.0",
      "PRODID:-//UNJYNX//UNJYNX App//EN",
      "CALSCALE:GREGORIAN",
      "BEGIN:VEVENT",
      `UID:${eventUID}`,
      `DTSTAMP:${toICalTimestamp(now)}`,
      `DTSTART:${toICalTimestamp(startDateTime)}`,
      `DTEND:${toICalTimestamp(endDateTime)}`,
      `SUMMARY:${input.title}`,
      `DESCRIPTION:${input.description ?? "UNJYNX task"}`,
      "STATUS:CONFIRMED",
      "SEQUENCE:0",
      "END:VEVENT",
      "END:VCALENDAR",
    ].join("\r\n");

    const response = await client.createCalendarObject({
      calendar,
      iCalString,
      filename: `unjynx-${input.taskId}.ics`,
    });

    // The external event ID is the UID we assigned
    const externalEventId = eventUID;

    log.info(
      { userId, taskId: input.taskId, eventUID },
      "CalDAV event created",
    );

    const [mapping] = await db
      .insert(calendarEventMapping)
      .values({
        taskId: input.taskId,
        userId,
        provider: PROVIDER_NAME,
        externalEventId,
        calendarId: calendar.url,
        lastSyncedAt: new Date(),
      })
      .onConflictDoUpdate({
        target: [calendarEventMapping.taskId, calendarEventMapping.provider],
        set: {
          externalEventId,
          calendarId: calendar.url,
          lastSyncedAt: new Date(),
        },
      })
      .returning();

    return mapping;
  } catch (error) {
    log.error(
      {
        userId,
        taskId: input.taskId,
        error:
          error instanceof Error ? error.message : "Unknown CalDAV error",
      },
      "CalDAV createEvent failed",
    );
    throw error;
  }
}

/**
 * Update a VEVENT on the CalDAV server for a task.
 * Returns the updated mapping, or null if no mapping exists.
 */
export async function updateCalDAVEvent(
  userId: string,
  taskId: string,
  updates: UpdateCalendarEventInput,
): Promise<CalendarEventMapping | null> {
  const [mapping] = await db
    .select()
    .from(calendarEventMapping)
    .where(
      and(
        eq(calendarEventMapping.taskId, taskId),
        eq(calendarEventMapping.provider, PROVIDER_NAME),
      ),
    )
    .limit(1);

  if (!mapping) return null;

  const tokenRow = await loadCalDAVTokens(userId);
  if (!tokenRow) return null;

  const client = buildDAVClient(tokenRow);

  try {
    await client.login();
    const calendars = await client.fetchCalendars();
    if (calendars.length === 0) return null;

    // Find the calendar that matches the mapping's calendarId
    const targetCalendar =
      calendars.find((c) => c.url === mapping.calendarId) ?? calendars[0];

    // Fetch the existing event to get its current data
    const objects = await client.fetchCalendarObjects({ calendar: targetCalendar });
    const existingObj = objects.find(
      (obj) => obj.data?.includes(mapping.externalEventId),
    );

    // Build updated iCalendar data
    const now = new Date();
    const title = updates.title ?? "UNJYNX Task";
    const description = updates.description ?? "UNJYNX task";
    const startDateTime = updates.dueDate
      ? new Date(updates.dueDate)
      : new Date();
    const endDateTime = new Date(startDateTime.getTime() + 30 * 60_000);

    const iCalString = [
      "BEGIN:VCALENDAR",
      "VERSION:2.0",
      "PRODID:-//UNJYNX//UNJYNX App//EN",
      "CALSCALE:GREGORIAN",
      "BEGIN:VEVENT",
      `UID:${mapping.externalEventId}`,
      `DTSTAMP:${toICalTimestamp(now)}`,
      `DTSTART:${toICalTimestamp(startDateTime)}`,
      `DTEND:${toICalTimestamp(endDateTime)}`,
      `SUMMARY:${title}`,
      `DESCRIPTION:${description}`,
      "STATUS:CONFIRMED",
      "SEQUENCE:1",
      "END:VEVENT",
      "END:VCALENDAR",
    ].join("\r\n");

    if (existingObj) {
      await client.updateCalendarObject({
        calendarObject: {
          url: existingObj.url,
          etag: existingObj.etag ?? undefined,
          data: iCalString,
        },
      });
    } else {
      // If we can't find the old event, create a new one with the same UID
      await client.createCalendarObject({
        calendar: targetCalendar,
        iCalString,
        filename: `unjynx-${taskId}.ics`,
      });
    }

    log.info({ userId, taskId }, "CalDAV event updated");

    const [updated] = await db
      .update(calendarEventMapping)
      .set({ lastSyncedAt: new Date() })
      .where(eq(calendarEventMapping.id, mapping.id))
      .returning();

    return updated;
  } catch (error) {
    log.error(
      {
        userId,
        taskId,
        error:
          error instanceof Error ? error.message : "Unknown CalDAV error",
      },
      "CalDAV updateEvent failed",
    );
    throw error;
  }
}

/**
 * Delete a VEVENT from the CalDAV server.
 * Returns true if deleted, false if no mapping existed.
 */
export async function deleteCalDAVEvent(
  userId: string,
  taskId: string,
): Promise<boolean> {
  const [mapping] = await db
    .select()
    .from(calendarEventMapping)
    .where(
      and(
        eq(calendarEventMapping.taskId, taskId),
        eq(calendarEventMapping.provider, PROVIDER_NAME),
      ),
    )
    .limit(1);

  if (!mapping) return false;

  const tokenRow = await loadCalDAVTokens(userId);

  if (tokenRow) {
    const client = buildDAVClient(tokenRow);

    try {
      await client.login();
      const calendars = await client.fetchCalendars();

      const targetCalendar =
        calendars.find((c) => c.url === mapping.calendarId) ?? calendars[0];

      if (targetCalendar) {
        const objects = await client.fetchCalendarObjects({
          calendar: targetCalendar,
        });
        const targetObj = objects.find(
          (obj) => obj.data?.includes(mapping.externalEventId),
        );

        if (targetObj) {
          await client.deleteCalendarObject({
            calendarObject: {
              url: targetObj.url,
              etag: targetObj.etag ?? undefined,
            },
          });
        }
      }

      log.info({ userId, taskId }, "CalDAV event deleted");
    } catch (error) {
      // Event may already be deleted on the CalDAV server
      const errMsg =
        error instanceof Error ? error.message : "Unknown error";
      log.warn(
        { userId, taskId, error: errMsg },
        "CalDAV deleteEvent failed (may already be deleted)",
      );
    }
  }

  await db
    .delete(calendarEventMapping)
    .where(eq(calendarEventMapping.id, mapping.id));

  return true;
}

// ── Error Classes ────────────────────────────────────────────────────

export class CalDAVConnectionError extends Error {
  constructor(message: string) {
    super(`CalDAV connection error: ${message}`);
    this.name = "CalDAVConnectionError";
  }
}
