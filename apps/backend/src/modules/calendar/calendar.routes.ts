import { Hono } from "hono";
import { zValidator } from "@hono/zod-validator";
import { authMiddleware } from "../../middleware/auth.js";
import { ok, err } from "../../types/api.js";
import {
  connectSchema,
  connectAppleSchema,
  connectOutlookSchema,
  eventsQuerySchema,
  createCalendarEventSchema,
  updateCalendarEventSchema,
} from "./calendar.schema.js";
import * as calendarService from "./calendar.service.js";
import { CalendarNotConnectedError } from "./calendar.service.js";
import * as caldavProvider from "./providers/caldav.provider.js";
import { CalDAVConnectionError } from "./providers/caldav.provider.js";
import * as msgraphProvider from "./providers/msgraph.provider.js";
import { OutlookAuthError } from "./providers/msgraph.provider.js";

export const calendarRoutes = new Hono();

calendarRoutes.use("/*", authMiddleware);

// ── Helper: handle provider API errors consistently ──────────────────

function handleProviderApiError(error: unknown) {
  // Google-specific errors
  const googleError = error as { code?: number; message?: string };

  if (googleError.code === 401) {
    return {
      message: "Calendar authorization expired. Please reconnect.",
      status: 401 as const,
    };
  }
  if (googleError.code === 403) {
    return {
      message: "Calendar API quota exceeded. Please try again later.",
      status: 429 as const,
    };
  }
  if (googleError.code === 404) {
    return {
      message: "Calendar or event not found.",
      status: 404 as const,
    };
  }

  // CalDAV errors
  if (error instanceof CalDAVConnectionError) {
    return {
      message: error.message,
      status: 401 as const,
    };
  }

  // Outlook errors
  if (error instanceof OutlookAuthError) {
    return {
      message: error.message,
      status: 401 as const,
    };
  }

  // MS Graph status code errors
  const graphError = error as { statusCode?: number };
  if (graphError.statusCode === 401) {
    return {
      message: "Outlook Calendar authorization expired. Please reconnect.",
      status: 401 as const,
    };
  }
  if (graphError.statusCode === 403) {
    return {
      message: "Outlook Calendar permissions insufficient.",
      status: 403 as const,
    };
  }

  return null;
}

// ── Google Calendar Connect ──────────────────────────────────────────

// POST /api/v1/calendar/connect - Exchange Google auth code for tokens
calendarRoutes.post(
  "/connect",
  zValidator("json", connectSchema),
  async (c) => {
    const auth = c.get("auth");
    const { authCode } = c.req.valid("json");

    try {
      const status = await calendarService.connectCalendar(
        auth.profileId,
        authCode,
      );
      return c.json(ok(status));
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Failed to connect calendar";
      return c.json(err(message), 400);
    }
  },
);

// ── Apple CalDAV Connect ─────────────────────────────────────────────

// POST /api/v1/calendar/connect/apple - Connect via CalDAV credentials
calendarRoutes.post(
  "/connect/apple",
  zValidator("json", connectAppleSchema),
  async (c) => {
    const auth = c.get("auth");
    const { caldavUrl, username, password } = c.req.valid("json");

    try {
      const status = await caldavProvider.connectCalDAV(
        auth.profileId,
        caldavUrl,
        username,
        password,
      );
      return c.json(ok(status));
    } catch (error) {
      const message =
        error instanceof Error
          ? error.message
          : "Failed to connect Apple Calendar";
      return c.json(err(message), 400);
    }
  },
);

// ── Outlook Connect ──────────────────────────────────────────────────

// POST /api/v1/calendar/connect/outlook - Exchange Microsoft auth code
calendarRoutes.post(
  "/connect/outlook",
  zValidator("json", connectOutlookSchema),
  async (c) => {
    const auth = c.get("auth");
    const { authCode } = c.req.valid("json");

    try {
      const status = await msgraphProvider.connectOutlook(
        auth.profileId,
        authCode,
      );
      return c.json(ok(status));
    } catch (error) {
      const message =
        error instanceof Error
          ? error.message
          : "Failed to connect Outlook Calendar";
      return c.json(err(message), 400);
    }
  },
);

// ── Provider Management ──────────────────────────────────────────────

// GET /api/v1/calendar/providers - List all connected providers
calendarRoutes.get("/providers", async (c) => {
  const auth = c.get("auth");
  const providers = await calendarService.getConnectedProviders(
    auth.profileId,
  );
  return c.json(ok(providers));
});

// DELETE /api/v1/calendar/disconnect - Remove stored tokens
// Optional query param: ?provider=google|apple|outlook
calendarRoutes.delete("/disconnect", async (c) => {
  const auth = c.get("auth");
  const provider = c.req.query("provider");

  try {
    await calendarService.disconnectProvider(auth.profileId, provider);
    return c.json(ok({ disconnected: true, provider: provider ?? "all" }));
  } catch (error) {
    if (error instanceof CalendarNotConnectedError) {
      return c.json(err(error.message), 404);
    }
    const message =
      error instanceof Error ? error.message : "Failed to disconnect calendar";
    return c.json(err(message), 500);
  }
});

// GET /api/v1/calendar/status - Check connection status (legacy, single-provider)
calendarRoutes.get("/status", async (c) => {
  const auth = c.get("auth");
  const status = await calendarService.getCalendarStatus(auth.profileId);
  return c.json(ok(status));
});

// ── Events (Multi-Provider Merge) ────────────────────────────────────

// GET /api/v1/calendar/events - Fetch events from ALL connected providers
calendarRoutes.get(
  "/events",
  zValidator("query", eventsQuerySchema),
  async (c) => {
    const auth = c.get("auth");
    const { start, end } = c.req.valid("query");

    try {
      const events = await calendarService.getAllProviderEvents(
        auth.profileId,
        start,
        end,
      );
      return c.json(ok(events));
    } catch (error) {
      if (error instanceof CalendarNotConnectedError) {
        return c.json(err(error.message), 404);
      }

      const providerErr = handleProviderApiError(error);
      if (providerErr) {
        return c.json(err(providerErr.message), providerErr.status);
      }

      const message =
        error instanceof Error
          ? error.message
          : "Failed to fetch calendar events";
      return c.json(err(message), 500);
    }
  },
);

// ── Write-Back Routes (Two-Way Sync) ─────────────────────────────────

// POST /api/v1/calendar/events - Create a calendar event for a task
calendarRoutes.post(
  "/events",
  zValidator("json", createCalendarEventSchema),
  async (c) => {
    const auth = c.get("auth");
    const input = c.req.valid("json");

    try {
      const mapping = await calendarService.createCalendarEvent(
        auth.profileId,
        input,
      );

      if (!mapping) {
        return c.json(
          err("No calendar is connected. Connect a provider first via /connect, /connect/apple, or /connect/outlook."),
          404,
        );
      }

      return c.json(ok(mapping), 201);
    } catch (error) {
      if (error instanceof CalendarNotConnectedError) {
        return c.json(err(error.message), 404);
      }

      const providerErr = handleProviderApiError(error);
      if (providerErr) {
        return c.json(err(providerErr.message), providerErr.status);
      }

      const message =
        error instanceof Error
          ? error.message
          : "Failed to create calendar event";
      return c.json(err(message), 500);
    }
  },
);

// PATCH /api/v1/calendar/events/:taskId - Update a calendar event for a task
calendarRoutes.patch(
  "/events/:taskId",
  zValidator("json", updateCalendarEventSchema),
  async (c) => {
    const auth = c.get("auth");
    const taskId = c.req.param("taskId");
    const updates = c.req.valid("json");

    try {
      const mapping = await calendarService.updateCalendarEvent(
        auth.profileId,
        taskId,
        updates,
      );

      if (!mapping) {
        return c.json(
          err("No calendar event mapping found for this task."),
          404,
        );
      }

      return c.json(ok(mapping));
    } catch (error) {
      const providerErr = handleProviderApiError(error);
      if (providerErr) {
        return c.json(err(providerErr.message), providerErr.status);
      }

      const message =
        error instanceof Error
          ? error.message
          : "Failed to update calendar event";
      return c.json(err(message), 500);
    }
  },
);

// DELETE /api/v1/calendar/events/:taskId - Delete a calendar event for a task
calendarRoutes.delete("/events/:taskId", async (c) => {
  const auth = c.get("auth");
  const taskId = c.req.param("taskId");

  try {
    const deleted = await calendarService.deleteCalendarEvent(
      auth.profileId,
      taskId,
    );

    if (!deleted) {
      return c.json(
        err("No calendar event mapping found for this task."),
        404,
      );
    }

    return c.json(ok({ deleted: true }));
  } catch (error) {
    const providerErr = handleProviderApiError(error);
    if (providerErr) {
      return c.json(err(providerErr.message), providerErr.status);
    }

    const message =
      error instanceof Error
        ? error.message
        : "Failed to delete calendar event";
    return c.json(err(message), 500);
  }
});
