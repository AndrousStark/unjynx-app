import { google } from "googleapis";
import { eq } from "drizzle-orm";
import { db } from "../../db/index.js";
import { calendarTokens } from "../../db/schema/index.js";
import { env } from "../../env.js";
import type {
  CalendarEvent,
  CalendarStatus,
} from "./calendar.schema.js";
import type { CalendarToken } from "../../db/schema/index.js";

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
    .where(eq(calendarTokens.userId, tokenRow.userId))
    .returning();

  return updated;
}

/**
 * Load tokens for a user. Returns null if not connected.
 */
async function loadTokens(userId: string): Promise<CalendarToken | null> {
  const [row] = await db
    .select()
    .from(calendarTokens)
    .where(eq(calendarTokens.userId, userId))
    .limit(1);

  return row ?? null;
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

  // Upsert: insert or update if user already has tokens
  await db
    .insert(calendarTokens)
    .values(values)
    .onConflictDoUpdate({
      target: calendarTokens.userId,
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

  const freshTokens = await refreshTokenIfNeeded(tokenRow);

  const oauth2 = createOAuth2Client();
  oauth2.setCredentials({
    access_token: freshTokens.accessToken,
    refresh_token: freshTokens.refreshToken,
  });

  const calendar = google.calendar({ version: "v3", auth: oauth2 });

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

// ── Error Classes ────────────────────────────────────────────────────

export class CalendarNotConnectedError extends Error {
  constructor() {
    super("Google Calendar is not connected");
    this.name = "CalendarNotConnectedError";
  }
}
