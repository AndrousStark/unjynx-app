/**
 * AI routes — proxy to the Python ML microservice + Claude API.
 *
 * ML service (existing):
 *   GET /api/v1/ai/optimal-time   — best notification hour
 *   GET /api/v1/ai/suggestions    — ranked task suggestions
 *   GET /api/v1/ai/energy         — 24-hour energy forecast
 *   GET /api/v1/ai/patterns       — habit pattern detection
 *
 * Claude API (new):
 *   POST /api/v1/ai/chat          — streaming chat via SSE
 *   POST /api/v1/ai/decompose     — task decomposition
 *   POST /api/v1/ai/schedule      — schedule suggestions
 */

import { Hono } from "hono";
import { streamSSE } from "hono/streaming";
import { zValidator } from "@hono/zod-validator";
import { authMiddleware } from "../../middleware/auth.js";
import { emailVerifiedGuard } from "../../middleware/email-verified-guard.js";
import { ok, err } from "../../types/api.js";
import {
  suggestionsQuerySchema,
  patternsQuerySchema,
  chatRequestSchema,
  decomposeRequestSchema,
  scheduleRequestSchema,
} from "./ai.schema.js";
import * as aiService from "./ai.service.js";
import * as claudeService from "../../services/claude.js";

export const aiRoutes = new Hono();

aiRoutes.use("/*", authMiddleware);
// All AI features require email verification
aiRoutes.use("/*", emailVerifiedGuard);

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

// ── Claude API Endpoints ────────────────────────────────────────────

// ── Helper: handle Claude errors consistently ───────────────────────

function handleClaudeError(error: unknown) {
  const message =
    error instanceof Error ? error.message : "AI service unavailable";

  if (message.includes("Daily AI limit reached")) {
    return { message, status: 429 as const };
  }
  if (message.includes("ANTHROPIC_API_KEY")) {
    return { message: "AI service is not configured", status: 503 as const };
  }

  return { message, status: 500 as const };
}

// POST /api/v1/ai/chat — streaming chat via SSE
aiRoutes.post(
  "/chat",
  zValidator("json", chatRequestSchema),
  async (c) => {
    const auth = c.get("auth");
    const body = c.req.valid("json");

    if (!claudeService.isClaudeEnabled()) {
      return c.json(err("AI service is not configured"), 503);
    }

    return streamSSE(c, async (stream) => {
      try {
        const generator = claudeService.chatStream({
          messages: body.messages,
          persona: body.persona,
          model: body.model as claudeService.ModelTier | undefined,
          profileId: auth.profileId,
        });

        let result = await generator.next();

        while (!result.done) {
          await stream.writeSSE({
            event: "text",
            data: result.value as string,
          });
          result = await generator.next();
        }

        // Send usage metadata at the end
        const usage = result.value;
        if (usage) {
          await stream.writeSSE({
            event: "usage",
            data: JSON.stringify(usage),
          });
        }

        await stream.writeSSE({ event: "done", data: "[DONE]" });
      } catch (error) {
        const claudeErr = handleClaudeError(error);
        await stream.writeSSE({
          event: "error",
          data: JSON.stringify({ message: claudeErr.message }),
        });
      }
    });
  },
);

// POST /api/v1/ai/decompose — task decomposition
aiRoutes.post(
  "/decompose",
  zValidator("json", decomposeRequestSchema),
  async (c) => {
    const auth = c.get("auth");
    const body = c.req.valid("json");

    if (!claudeService.isClaudeEnabled()) {
      return c.json(err("AI service is not configured"), 503);
    }

    try {
      const result = await claudeService.decomposeTask(
        body.taskTitle,
        body.description,
        auth.profileId,
      );

      return c.json(
        ok({
          subtasks: result.subtasks,
          reasoning: result.reasoning,
        }),
      );
    } catch (error) {
      const claudeErr = handleClaudeError(error);
      return c.json(err(claudeErr.message), claudeErr.status);
    }
  },
);

// POST /api/v1/ai/schedule — schedule suggestions
aiRoutes.post(
  "/schedule",
  zValidator("json", scheduleRequestSchema),
  async (c) => {
    const auth = c.get("auth");
    const body = c.req.valid("json");

    if (!claudeService.isClaudeEnabled()) {
      return c.json(err("AI service is not configured"), 503);
    }

    try {
      // Build task objects from IDs — in production this would fetch
      // from DB, for now we pass minimal info to Claude.
      const tasks = body.taskIds.map((id) => ({
        id,
        title: `Task ${id.slice(0, 8)}`,
        priority: "medium" as const,
      }));

      // Try to get energy forecast from ML service for context
      let energyForecast: { hour: number; energy: number }[] = [];
      try {
        const energyResult = await aiService.getEnergyForecast(
          auth.profileId,
        );
        energyForecast = energyResult.forecast.map((h) => ({
          hour: h.hour,
          energy: h.energy,
        }));
      } catch {
        // ML service unavailable — proceed without energy data
      }

      const result = await claudeService.scheduleSuggestion(
        tasks,
        { energyForecast },
        auth.profileId,
      );

      return c.json(
        ok({
          schedule: result.schedule,
          insights: result.insights,
        }),
      );
    } catch (error) {
      const claudeErr = handleClaudeError(error);
      return c.json(err(claudeErr.message), claudeErr.status);
    }
  },
);
