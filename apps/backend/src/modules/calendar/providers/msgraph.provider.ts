// ── Microsoft Graph Provider ────────────────────────────────────────
// Implements Outlook Calendar support via Microsoft Graph API.
// Uses the @microsoft/microsoft-graph-client SDK with custom auth.
// OAuth tokens are stored in calendarTokens with provider='outlook'.

import { Client } from "@microsoft/microsoft-graph-client";
import type { AuthenticationProvider } from "@microsoft/microsoft-graph-client";
import { eq, and } from "drizzle-orm";
import { db } from "../../../db/index.js";
import {
  calendarTokens,
  calendarEventMapping,
} from "../../../db/schema/index.js";
import { env } from "../../../env.js";
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

const log = logger.child({ module: "msgraph-provider" });

// ── Constants ────────────────────────────────────────────────────────

const PROVIDER_NAME = "outlook";
const TOKEN_ENDPOINT =
  "https://login.microsoftonline.com/common/oauth2/v2.0/token";
const CALENDAR_SCOPE = "Calendars.ReadWrite offline_access";
const TOKEN_BUFFER_MS = 5 * 60_000; // Refresh 5 min before expiry

// ── Helpers ──────────────────────────────────────────────────────────

/**
 * Load Outlook tokens for a user. Returns null if not connected.
 */
async function loadOutlookTokens(
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
 * Exchange an authorization code for Microsoft OAuth tokens.
 */
async function exchangeCodeForTokens(
  authCode: string,
): Promise<{
  readonly accessToken: string;
  readonly refreshToken: string;
  readonly expiresAt: Date;
}> {
  const clientId = env.MICROSOFT_CLIENT_ID;
  const clientSecret = env.MICROSOFT_CLIENT_SECRET;

  if (!clientId || !clientSecret) {
    throw new Error(
      "Outlook Calendar integration requires MICROSOFT_CLIENT_ID and MICROSOFT_CLIENT_SECRET",
    );
  }

  const params = new URLSearchParams({
    client_id: clientId,
    client_secret: clientSecret,
    code: authCode,
    grant_type: "authorization_code",
    scope: CALENDAR_SCOPE,
    redirect_uri: "unjynx://auth/callback",
  });

  const response = await fetch(TOKEN_ENDPOINT, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: params.toString(),
  });

  if (!response.ok) {
    const errorBody = await response.text();
    log.error(
      { status: response.status, body: errorBody },
      "Microsoft token exchange failed",
    );
    throw new Error(
      `Microsoft OAuth token exchange failed (${response.status}): ${errorBody}`,
    );
  }

  const data = (await response.json()) as {
    readonly access_token: string;
    readonly refresh_token?: string;
    readonly expires_in: number;
  };

  if (!data.access_token) {
    throw new Error("Microsoft OAuth did not return an access token");
  }

  return {
    accessToken: data.access_token,
    refreshToken: data.refresh_token ?? "",
    expiresAt: new Date(Date.now() + data.expires_in * 1000),
  };
}

/**
 * Refresh the Microsoft access token using the stored refresh token.
 * Returns a fresh token row (never mutates the input).
 */
async function refreshTokenIfNeeded(
  tokenRow: CalendarToken,
): Promise<CalendarToken> {
  const isExpired =
    tokenRow.expiresAt.getTime() - Date.now() < TOKEN_BUFFER_MS;

  if (!isExpired) return tokenRow;

  const clientId = env.MICROSOFT_CLIENT_ID;
  const clientSecret = env.MICROSOFT_CLIENT_SECRET;

  if (!clientId || !clientSecret) {
    throw new Error(
      "Outlook Calendar integration requires MICROSOFT_CLIENT_ID and MICROSOFT_CLIENT_SECRET",
    );
  }

  const params = new URLSearchParams({
    client_id: clientId,
    client_secret: clientSecret,
    refresh_token: tokenRow.refreshToken,
    grant_type: "refresh_token",
    scope: CALENDAR_SCOPE,
  });

  const response = await fetch(TOKEN_ENDPOINT, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: params.toString(),
  });

  if (!response.ok) {
    const errorBody = await response.text();
    log.error(
      { status: response.status, userId: tokenRow.userId },
      "Microsoft token refresh failed",
    );
    throw new OutlookAuthError(
      `Token refresh failed (${response.status}): ${errorBody}`,
    );
  }

  const data = (await response.json()) as {
    readonly access_token: string;
    readonly refresh_token?: string;
    readonly expires_in: number;
  };

  const updatedFields = {
    accessToken: data.access_token,
    refreshToken: data.refresh_token ?? tokenRow.refreshToken,
    expiresAt: new Date(Date.now() + data.expires_in * 1000),
    updatedAt: new Date(),
  };

  const [updated] = await db
    .update(calendarTokens)
    .set(updatedFields)
    .where(
      and(
        eq(calendarTokens.userId, tokenRow.userId),
        eq(calendarTokens.provider, PROVIDER_NAME),
      ),
    )
    .returning();

  return updated;
}

/**
 * Build an authenticated Microsoft Graph client from a token row.
 */
async function buildGraphClient(
  tokenRow: CalendarToken,
): Promise<{ readonly client: Client; readonly tokens: CalendarToken }> {
  const freshTokens = await refreshTokenIfNeeded(tokenRow);

  const authProvider: AuthenticationProvider = {
    async getAccessToken(): Promise<string> {
      return freshTokens.accessToken;
    },
  };

  const client = Client.initWithMiddleware({ authProvider });

  return { client, tokens: freshTokens };
}

// ── Public API ───────────────────────────────────────────────────────

/**
 * Exchange an OAuth authorization code for Outlook tokens and store them.
 */
export async function connectOutlook(
  userId: string,
  authCode: string,
): Promise<{
  readonly connected: boolean;
  readonly provider: string;
  readonly calendarId: string;
}> {
  const tokens = await exchangeCodeForTokens(authCode);

  if (!tokens.refreshToken) {
    throw new Error(
      "Microsoft OAuth did not return a refresh token. " +
        "Ensure your auth request includes offline_access scope.",
    );
  }

  const values = {
    userId,
    provider: PROVIDER_NAME,
    accessToken: tokens.accessToken,
    refreshToken: tokens.refreshToken,
    expiresAt: tokens.expiresAt,
    calendarId: "primary",
    updatedAt: new Date(),
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
        updatedAt: values.updatedAt,
      },
    });

  log.info({ userId }, "Outlook Calendar connected");

  return {
    connected: true,
    provider: PROVIDER_NAME,
    calendarId: "primary",
  };
}

/**
 * Fetch calendar events from Outlook for the given date range.
 */
export async function getOutlookEvents(
  userId: string,
  start: Date,
  end: Date,
): Promise<readonly CalendarEvent[]> {
  const tokenRow = await loadOutlookTokens(userId);
  if (!tokenRow) return [];

  const { client } = await buildGraphClient(tokenRow);

  try {
    const response = await client
      .api("/me/calendarView")
      .query({
        startDateTime: start.toISOString(),
        endDateTime: end.toISOString(),
      })
      .select("id,subject,bodyPreview,start,end,isAllDay,location,showAs")
      .orderby("start/dateTime")
      .top(100)
      .get();

    const items = (response?.value ?? []) as ReadonlyArray<{
      readonly id: string;
      readonly subject: string;
      readonly bodyPreview?: string;
      readonly start: { readonly dateTime: string; readonly timeZone: string };
      readonly end: { readonly dateTime: string; readonly timeZone: string };
      readonly isAllDay: boolean;
      readonly location?: { readonly displayName?: string };
      readonly showAs?: string;
    }>;

    return items.map(
      (event): CalendarEvent => ({
        id: event.id,
        title: event.subject ?? "(No title)",
        description: event.bodyPreview ?? null,
        start: event.start.dateTime,
        end: event.end.dateTime,
        allDay: event.isAllDay,
        location: event.location?.displayName ?? null,
        status: event.showAs === "free" ? "tentative" : "confirmed",
        htmlLink: null,
      }),
    );
  } catch (error) {
    log.error(
      {
        userId,
        error: error instanceof Error ? error.message : "Unknown Graph error",
      },
      "Outlook getEvents failed",
    );
    throw error;
  }
}

/**
 * Create an Outlook Calendar event for a task and store the mapping.
 * Returns the mapping row, or null if user has no Outlook connected.
 */
export async function createOutlookEvent(
  userId: string,
  input: CreateCalendarEventInput,
): Promise<CalendarEventMapping | null> {
  const tokenRow = await loadOutlookTokens(userId);
  if (!tokenRow) return null;

  const { client } = await buildGraphClient(tokenRow);

  const startDateTime = new Date(input.dueDate);
  const endDateTime = new Date(startDateTime.getTime() + 30 * 60_000);

  try {
    const event = (await client.api("/me/events").post({
      subject: input.title,
      body: {
        contentType: "Text",
        content: input.description ?? "UNJYNX task",
      },
      start: {
        dateTime: startDateTime.toISOString(),
        timeZone: "UTC",
      },
      end: {
        dateTime: endDateTime.toISOString(),
        timeZone: "UTC",
      },
      categories: ["UNJYNX"],
    })) as { readonly id: string };

    if (!event.id) {
      throw new Error("Outlook did not return an event ID");
    }

    log.info(
      { userId, taskId: input.taskId, eventId: event.id },
      "Outlook event created",
    );

    const [mapping] = await db
      .insert(calendarEventMapping)
      .values({
        taskId: input.taskId,
        userId,
        provider: PROVIDER_NAME,
        externalEventId: event.id,
        calendarId: "primary",
        lastSyncedAt: new Date(),
      })
      .onConflictDoUpdate({
        target: [calendarEventMapping.taskId, calendarEventMapping.provider],
        set: {
          externalEventId: event.id,
          calendarId: "primary",
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
        error: error instanceof Error ? error.message : "Unknown Graph error",
      },
      "Outlook createEvent failed",
    );
    throw error;
  }
}

/**
 * Update an existing Outlook Calendar event when a task changes.
 * Returns the updated mapping, or null if no mapping exists.
 */
export async function updateOutlookEvent(
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

  const tokenRow = await loadOutlookTokens(userId);
  if (!tokenRow) return null;

  const { client } = await buildGraphClient(tokenRow);

  // Build partial update payload
  const requestBody: Record<string, unknown> = {};

  if (updates.title !== undefined) {
    requestBody.subject = updates.title;
  }
  if (updates.description !== undefined) {
    requestBody.body = {
      contentType: "Text",
      content: updates.description,
    };
  }
  if (updates.dueDate !== undefined) {
    const startDateTime = new Date(updates.dueDate);
    const endDateTime = new Date(startDateTime.getTime() + 30 * 60_000);
    requestBody.start = {
      dateTime: startDateTime.toISOString(),
      timeZone: "UTC",
    };
    requestBody.end = {
      dateTime: endDateTime.toISOString(),
      timeZone: "UTC",
    };
  }

  try {
    await client
      .api(`/me/events/${mapping.externalEventId}`)
      .patch(requestBody);

    log.info({ userId, taskId }, "Outlook event updated");

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
        error: error instanceof Error ? error.message : "Unknown Graph error",
      },
      "Outlook updateEvent failed",
    );
    throw error;
  }
}

/**
 * Delete an Outlook Calendar event when a task is removed.
 * Returns true if deleted, false if no mapping existed.
 */
export async function deleteOutlookEvent(
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

  const tokenRow = await loadOutlookTokens(userId);

  if (tokenRow) {
    const { client } = await buildGraphClient(tokenRow);

    try {
      await client
        .api(`/me/events/${mapping.externalEventId}`)
        .delete();

      log.info({ userId, taskId }, "Outlook event deleted");
    } catch (error) {
      // Event may already be deleted on Outlook side
      const graphError = error as { statusCode?: number };
      if (graphError.statusCode !== 404) {
        log.warn(
          {
            userId,
            taskId,
            error:
              error instanceof Error ? error.message : "Unknown error",
          },
          "Outlook deleteEvent failed (may already be deleted)",
        );
      }
    }
  }

  await db
    .delete(calendarEventMapping)
    .where(eq(calendarEventMapping.id, mapping.id));

  return true;
}

// ── Error Classes ────────────────────────────────────────────────────

export class OutlookAuthError extends Error {
  constructor(message: string) {
    super(`Outlook auth error: ${message}`);
    this.name = "OutlookAuthError";
  }
}
