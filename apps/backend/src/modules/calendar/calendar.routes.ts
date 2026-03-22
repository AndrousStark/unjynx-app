import { Hono } from "hono";
import { zValidator } from "@hono/zod-validator";
import { authMiddleware } from "../../middleware/auth.js";
import { ok, err } from "../../types/api.js";
import {
  connectSchema,
  eventsQuerySchema,
  createCalendarEventSchema,
  updateCalendarEventSchema,
} from "./calendar.schema.js";
import * as calendarService from "./calendar.service.js";
import { CalendarNotConnectedError } from "./calendar.service.js";

export const calendarRoutes = new Hono();

calendarRoutes.use("/*", authMiddleware);

// ── Helper: handle Google API errors consistently ────────────────────

function handleGoogleApiError(error: unknown) {
  const googleError = error as { code?: number; message?: string };

  if (googleError.code === 401) {
    return {
      message: "Google Calendar authorization expired. Please reconnect.",
      status: 401 as const,
    };
  }
  if (googleError.code === 403) {
    return {
      message: "Google Calendar API quota exceeded. Please try again later.",
      status: 429 as const,
    };
  }
  if (googleError.code === 404) {
    return {
      message: "Calendar or event not found on Google.",
      status: 404 as const,
    };
  }

  return null;
}

// POST /api/v1/calendar/connect - Exchange auth code for tokens
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

// DELETE /api/v1/calendar/disconnect - Remove stored tokens
calendarRoutes.delete("/disconnect", async (c) => {
  const auth = c.get("auth");

  try {
    await calendarService.disconnectCalendar(auth.profileId);
    return c.json(ok({ disconnected: true }));
  } catch (error) {
    if (error instanceof CalendarNotConnectedError) {
      return c.json(err(error.message), 404);
    }
    const message =
      error instanceof Error ? error.message : "Failed to disconnect calendar";
    return c.json(err(message), 500);
  }
});

// GET /api/v1/calendar/status - Check connection status
calendarRoutes.get("/status", async (c) => {
  const auth = c.get("auth");
  const status = await calendarService.getCalendarStatus(auth.profileId);
  return c.json(ok(status));
});

// GET /api/v1/calendar/events - Fetch events for a date range
calendarRoutes.get(
  "/events",
  zValidator("query", eventsQuerySchema),
  async (c) => {
    const auth = c.get("auth");
    const { start, end } = c.req.valid("query");

    try {
      const events = await calendarService.getCalendarEvents(
        auth.profileId,
        start,
        end,
      );
      return c.json(ok(events));
    } catch (error) {
      if (error instanceof CalendarNotConnectedError) {
        return c.json(err(error.message), 404);
      }

      const googleErr = handleGoogleApiError(error);
      if (googleErr) {
        return c.json(err(googleErr.message), googleErr.status);
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
          err("Google Calendar is not connected. Connect first via /connect."),
          404,
        );
      }

      return c.json(ok(mapping), 201);
    } catch (error) {
      if (error instanceof CalendarNotConnectedError) {
        return c.json(err(error.message), 404);
      }

      const googleErr = handleGoogleApiError(error);
      if (googleErr) {
        return c.json(err(googleErr.message), googleErr.status);
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
      const googleErr = handleGoogleApiError(error);
      if (googleErr) {
        return c.json(err(googleErr.message), googleErr.status);
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
    const googleErr = handleGoogleApiError(error);
    if (googleErr) {
      return c.json(err(googleErr.message), googleErr.status);
    }

    const message =
      error instanceof Error
        ? error.message
        : "Failed to delete calendar event";
    return c.json(err(message), 500);
  }
});
