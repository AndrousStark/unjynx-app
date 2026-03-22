/**
 * AI routes — proxy to the Python ML microservice.
 *
 * GET /api/v1/ai/optimal-time   — best notification hour
 * GET /api/v1/ai/suggestions    — ranked task suggestions
 * GET /api/v1/ai/energy         — 24-hour energy forecast
 * GET /api/v1/ai/patterns       — habit pattern detection
 */

import { Hono } from "hono";
import { zValidator } from "@hono/zod-validator";
import { authMiddleware } from "../../middleware/auth.js";
import { ok, err } from "../../types/api.js";
import { suggestionsQuerySchema, patternsQuerySchema } from "./ai.schema.js";
import * as aiService from "./ai.service.js";

export const aiRoutes = new Hono();

aiRoutes.use("/*", authMiddleware);

// ── Helper: handle ML service errors consistently ───────────────────────

function handleMlError(error: unknown) {
  const message =
    error instanceof Error ? error.message : "ML service unavailable";

  // If ML service is down, return a 503 so the client knows to retry
  if (
    message.includes("ECONNREFUSED") ||
    message.includes("abort") ||
    message.includes("timeout")
  ) {
    return { message: "ML service is temporarily unavailable", status: 503 as const };
  }

  return { message, status: 502 as const };
}

// GET /api/v1/ai/optimal-time
aiRoutes.get("/optimal-time", async (c) => {
  const auth = c.get("auth");

  try {
    const result = await aiService.getOptimalTime(auth.profileId);
    return c.json(ok(result));
  } catch (error) {
    const mlErr = handleMlError(error);
    return c.json(err(mlErr.message), mlErr.status);
  }
});

// GET /api/v1/ai/suggestions?limit=10&hour=14&day=2&energy=4
aiRoutes.get(
  "/suggestions",
  zValidator("query", suggestionsQuerySchema),
  async (c) => {
    const auth = c.get("auth");
    const query = c.req.valid("query");

    try {
      const result = await aiService.getSuggestions(auth.profileId, {
        limit: query.limit,
        hour: query.hour,
        day: query.day,
        energy: query.energy,
      });
      return c.json(ok(result));
    } catch (error) {
      const mlErr = handleMlError(error);
      return c.json(err(mlErr.message), mlErr.status);
    }
  },
);

// GET /api/v1/ai/energy
aiRoutes.get("/energy", async (c) => {
  const auth = c.get("auth");

  try {
    const result = await aiService.getEnergyForecast(auth.profileId);
    return c.json(ok(result));
  } catch (error) {
    const mlErr = handleMlError(error);
    return c.json(err(mlErr.message), mlErr.status);
  }
});

// GET /api/v1/ai/patterns?days=90
aiRoutes.get(
  "/patterns",
  zValidator("query", patternsQuerySchema),
  async (c) => {
    const auth = c.get("auth");
    const query = c.req.valid("query");

    try {
      const result = await aiService.getPatterns(auth.profileId, {
        days: query.days,
      });
      return c.json(ok(result));
    } catch (error) {
      const mlErr = handleMlError(error);
      return c.json(err(mlErr.message), mlErr.status);
    }
  },
);
