import { Hono } from "hono";
import { zValidator } from "@hono/zod-validator";
import { authMiddleware } from "../../middleware/auth.js";
import { ok, err } from "../../types/api.js";
import { connectSchema, eventsQuerySchema } from "./calendar.schema.js";
import * as calendarService from "./calendar.service.js";
import { CalendarNotConnectedError } from "./calendar.service.js";

export const calendarRoutes = new Hono();

calendarRoutes.use("/*", authMiddleware);

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

      // Handle specific Google API errors
      const googleError = error as { code?: number; message?: string };

      if (googleError.code === 401) {
        return c.json(
          err("Google Calendar authorization expired. Please reconnect."),
          401,
        );
      }
      if (googleError.code === 403) {
        return c.json(
          err("Google Calendar API quota exceeded. Please try again later."),
          429,
        );
      }
      if (googleError.code === 404) {
        return c.json(err("Calendar not found on Google."), 404);
      }

      const message =
        error instanceof Error
          ? error.message
          : "Failed to fetch calendar events";
      return c.json(err(message), 500);
    }
  },
);
