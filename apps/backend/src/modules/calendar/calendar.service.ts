import { google } from "googleapis";
import { eq, and } from "drizzle-orm";
import { db } from "../../db/index.js";
import {
  calendarTokens,
  calendarEventMapping,
} from "../../db/schema/index.js";
import { env } from "../../env.js";
import type {
  CalendarEvent,
  CalendarStatus,
  CreateCalendarEventInput,
  UpdateCalendarEventInput,
} from "./calendar.schema.js";
import type {
  CalendarToken,
  CalendarEventMapping,
} from "../../db/schema/index.js";

// ── Helpers ──────────────────────────────────────────────────────────

function createOAuth2Client() {
  const clientId = env.GOOGLE_CLIENT_ID;
  const clientSecret = env.GOOGLE_CLIENT_SECRET;

  if (!clientId || !clientSecret) {
    throw new Error(
      "Google Calendar integration requires GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET",
    );
  }

  return new google.auth.OAuth2(clientId, clientSecret, "postmessage");
}

/**
 * Refresh the access token if it has expired or will expire within 5 minutes.
 * Returns a fresh token row (never mutates the input).
 */
async function refreshTokenIfNeeded(
  tokenRow: CalendarToken,
): Promise<CalendarToken> {
  const bufferMs = 5 * 60_000; // 5 minutes
  const isExpired = tokenRow.expiresAt.getTime() - Date.now() < bufferMs;

  if (!isExpired) {
    return tokenRow;
  }

  const oauth2 = createOAuth2Client();
  oauth2.setCredentials({ refresh_token: tokenRow.refreshToken });

  const { credentials } = await oauth2.refreshAccessToken();

  if (!credentials.access_token || !credentials.expiry_date) {
    throw new Error("Failed to refresh Google access token");
  }

  const updatedFields = {
    accessToken: credentials.access_token,
    expiresAt: new Date(credentials.expiry_date),
    updatedAt: new Date(),
  };

  const [updated] = await db
    .update(calendarTokens)
    .set(updatedFields)
    .where(
      and(
        eq(calendarTokens.userId, tokenRow.userId),
        eq(calendarTokens.provider, tokenRow.provider),
      ),
    )
    .returning();

  return updated;
}

/**
 * Load tokens for a user + provider combination. Returns null if not connected.
 */
async function loadTokens(
  userId: string,
  provider: string = "google",
): Promise<CalendarToken | null> {
  const [row] = await db
    .select()
    .from(calendarTokens)
    .where(
      and(
        eq(calendarTokens.userId, userId),
        eq(calendarTokens.provider, provider),
      ),
    )
    .limit(1);

  return row ?? null;
}

/**
 * Build an authenticated Google Calendar API client from a token row.
 */
async function buildCalendarClient(tokenRow: CalendarToken) {
  const freshTokens = await refreshTokenIfNeeded(tokenRow);

  const oauth2 = createOAuth2Client();
  oauth2.setCredentials({
    access_token: freshTokens.accessToken,
    refresh_token: freshTokens.refreshToken,
  });

  return {
    calendar: google.calendar({ version: "v3", auth: oauth2 }),
    tokens: freshTokens,
  };
}

// ── Public API ───────────────────────────────────────────────────────

/**
 * Exchange a Google OAuth2 authorization code for tokens and store them.
 */
export async function connectCalendar(
  userId: string,
  authCode: string,
): Promise<CalendarStatus> {
  const oauth2 = createOAuth2Client();

  const { tokens } = await oauth2.getToken(authCode);

  if (!tokens.access_token || !tokens.refresh_token) {
    throw new Error(
      "Google OAuth did not return required tokens. Ensure access_type=offline and prompt=consent.",
    );
  }

  const expiresAt = tokens.expiry_date
    ? new Date(tokens.expiry_date)
    : new Date(Date.now() + 3600 * 1000); // fallback: 1 hour

  const values = {
    userId,
    provider: "google" as const,
    accessToken: tokens.access_token,
    refreshToken: tokens.refresh_token,
    expiresAt,
    calendarId: "primary",
    updatedAt: new Date(),
  };

  // Upsert: insert or update if user+provider already has tokens
  await db
    .insert(calendarTokens)
    .values(values)
    .onConflictDoUpdate({
      target: [calendarTokens.userId, calendarTokens.provider],
      set: {
        accessToken: values.accessToken,
        refreshToken: values.refreshToken,
        expiresAt: values.expiresAt,
        updatedAt: values.updatedAt,
      },
    });

  return {
    connected: true,
    provider: "google",
    calendarId: "primary",
  };
}

/**
 * Remove stored tokens, disconnecting the user's calendar.
 */
export async function disconnectCalendar(userId: string): Promise<void> {
  const deleted = await db
    .delete(calendarTokens)
    .where(eq(calendarTokens.userId, userId))
    .returning();

  if (deleted.length === 0) {
    throw new CalendarNotConnectedError();
  }
}

/**
 * Check whether a user has connected their calendar.
 */
export async function getCalendarStatus(
  userId: string,
): Promise<CalendarStatus> {
  const row = await loadTokens(userId);

  if (!row) {
    return { connected: false, provider: null, calendarId: null };
  }

  return {
    connected: true,
    provider: row.provider,
    calendarId: row.calendarId,
  };
}

/**
 * Fetch calendar events from Google Calendar for the given date range.
 */
export async function getCalendarEvents(
  userId: string,
  start: Date,
  end: Date,
): Promise<readonly CalendarEvent[]> {
  const tokenRow = await loadTokens(userId);

  if (!tokenRow) {
    throw new CalendarNotConnectedError();
  }

  const { calendar, tokens: freshTokens } =
    await buildCalendarClient(tokenRow);

  const res = await calendar.events.list({
    calendarId: freshTokens.calendarId ?? "primary",
    timeMin: start.toISOString(),
    timeMax: end.toISOString(),
    singleEvents: true,
    orderBy: "startTime",
    maxResults: 100,
  });

  const items = res.data.items ?? [];

  return items.map((event): CalendarEvent => {
    const isAllDay = Boolean(event.start?.date);

    return {
      id: event.id ?? "",
      title: event.summary ?? "(No title)",
      description: event.description ?? null,
      start: event.start?.dateTime ?? event.start?.date ?? "",
      end: event.end?.dateTime ?? event.end?.date ?? "",
      allDay: isAllDay,
      location: event.location ?? null,
      status: event.status ?? "confirmed",
      htmlLink: event.htmlLink ?? null,
    };
  });
}

// ── Write-Back (Two-Way Sync) ────────────────────────────────────────

/**
 * Create a Google Calendar event for a task and store the mapping.
 * Returns the mapping row, or null if user has no calendar connected.
 */
export async function createCalendarEvent(
  userId: string,
  input: CreateCalendarEventInput,
): Promise<CalendarEventMapping | null> {
  const tokenRow = await loadTokens(userId);

  if (!tokenRow) {
    return null;
  }

  const { calendar, tokens: freshTokens } =
    await buildCalendarClient(tokenRow);

  const calendarId = freshTokens.calendarId ?? "primary";

  // Build event payload — use 30-minute slot if only a due date is given
  const startDateTime = new Date(input.dueDate);
  const endDateTime = new Date(startDateTime.getTime() + 30 * 60_000);

  const res = await calendar.events.insert({
    calendarId,
    requestBody: {
      summary: input.title,
      description: input.description ?? `UNJYNX task`,
      start: { dateTime: startDateTime.toISOString() },
      end: { dateTime: endDateTime.toISOString() },
      source: {
        title: "UNJYNX",
        url: "https://unjynx.me",
      },
    },
  });

  const externalEventId = res.data.id;

  if (!externalEventId) {
    throw new Error("Google Calendar did not return an event ID");
  }

  const [mapping] = await db
    .insert(calendarEventMapping)
    .values({
      taskId: input.taskId,
      userId,
      provider: "google",
      externalEventId,
      calendarId,
      lastSyncedAt: new Date(),
    })
    .onConflictDoUpdate({
      target: [calendarEventMapping.taskId, calendarEventMapping.provider],
      set: {
        externalEventId,
        calendarId,
        lastSyncedAt: new Date(),
      },
    })
    .returning();

  return mapping;
}

/**
 * Update an existing Google Calendar event when a task changes.
 * Returns the updated mapping, or null if no mapping exists.
 */
export async function updateCalendarEvent(
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
        eq(calendarEventMapping.provider, "google"),
      ),
    )
    .limit(1);

  if (!mapping) {
    return null;
  }

  const tokenRow = await loadTokens(userId);

  if (!tokenRow) {
    return null;
  }

  const { calendar, tokens: freshTokens } =
    await buildCalendarClient(tokenRow);

  const calendarId = freshTokens.calendarId ?? "primary";

  // Build partial update payload
  const requestBody: Record<string, unknown> = {};

  if (updates.title !== undefined) {
    requestBody.summary = updates.title;
  }
  if (updates.description !== undefined) {
    requestBody.description = updates.description;
  }
  if (updates.dueDate !== undefined) {
    const startDateTime = new Date(updates.dueDate);
    const endDateTime = new Date(startDateTime.getTime() + 30 * 60_000);
    requestBody.start = { dateTime: startDateTime.toISOString() };
    requestBody.end = { dateTime: endDateTime.toISOString() };
  }

  await calendar.events.patch({
    calendarId,
    eventId: mapping.externalEventId,
    requestBody,
  });

  const [updated] = await db
    .update(calendarEventMapping)
    .set({ lastSyncedAt: new Date() })
    .where(eq(calendarEventMapping.id, mapping.id))
    .returning();

  return updated;
}

/**
 * Delete a Google Calendar event when a task is removed.
 * Returns true if an event was deleted, false if no mapping existed.
 */
export async function deleteCalendarEvent(
  userId: string,
  taskId: string,
): Promise<boolean> {
  const [mapping] = await db
    .select()
    .from(calendarEventMapping)
    .where(
      and(
        eq(calendarEventMapping.taskId, taskId),
        eq(calendarEventMapping.provider, "google"),
      ),
    )
    .limit(1);

  if (!mapping) {
    return false;
  }

  const tokenRow = await loadTokens(userId);

  if (tokenRow) {
    const { calendar, tokens: freshTokens } =
      await buildCalendarClient(tokenRow);

    const calendarId = freshTokens.calendarId ?? "primary";

    try {
      await calendar.events.delete({
        calendarId,
        eventId: mapping.externalEventId,
      });
    } catch (error) {
      // Event may already be deleted on Google side — log but don't throw
      const googleError = error as { code?: number };
      if (googleError.code !== 404 && googleError.code !== 410) {
        throw error;
      }
    }
  }

  await db
    .delete(calendarEventMapping)
    .where(eq(calendarEventMapping.id, mapping.id));

  return true;
}

// ── Error Classes ────────────────────────────────────────────────────

export class CalendarNotConnectedError extends Error {
  constructor() {
    super("Google Calendar is not connected");
    this.name = "CalendarNotConnectedError";
  }
}
