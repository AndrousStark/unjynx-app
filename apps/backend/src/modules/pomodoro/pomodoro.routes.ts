// ── Pomodoro API Routes ───────────────────────────────────────────────

import { Hono } from "hono";
import { zValidator } from "@hono/zod-validator";
import { z } from "zod";
import { authMiddleware } from "../../middleware/auth.js";
import { ok, err } from "../../types/api.js";
import * as pomodoroService from "./pomodoro.service.js";

export const pomodoroRoutes = new Hono();

pomodoroRoutes.use("/*", authMiddleware);

// ── POST /pomodoro/start — Start a Pomodoro session ──
const startSchema = z.object({
  taskId: z.string().uuid().optional(),
  durationMinutes: z.number().min(5).max(120).optional(),
});

pomodoroRoutes.post(
  "/start",
  zValidator("json", startSchema),
  async (c) => {
    const auth = c.get("auth");
    const body = c.req.valid("json");
    const session = await pomodoroService.startSession(
      auth.profileId,
      body.taskId,
      body.durationMinutes,
    );
    return c.json(ok(session), 201);
  },
);

// ── POST /pomodoro/complete — Complete the active session ──
const completeSchema = z.object({
  focusRating: z.number().min(1).max(5).optional(),
});

pomodoroRoutes.post(
  "/complete",
  zValidator("json", completeSchema),
  async (c) => {
    const auth = c.get("auth");
    const body = c.req.valid("json");
    const session = await pomodoroService.completeSession(
      auth.profileId,
      body.focusRating,
    );
    if (!session) {
      return c.json(err("No active Pomodoro session"), 404);
    }
    return c.json(ok(session));
  },
);

// ── POST /pomodoro/abandon — Abandon the active session ──
pomodoroRoutes.post("/abandon", async (c) => {
  const auth = c.get("auth");
  const abandoned = await pomodoroService.abandonSession(auth.profileId);
  if (!abandoned) {
    return c.json(err("No active Pomodoro session"), 404);
  }
  return c.json(ok({ abandoned: true }));
});

// ── GET /pomodoro/active — Get current active session ──
pomodoroRoutes.get("/active", async (c) => {
  const auth = c.get("auth");
  const active = await pomodoroService.getActiveSession(auth.profileId);
  return c.json(ok(active));
});

// ── GET /pomodoro/stats — Get Pomodoro statistics ──
pomodoroRoutes.get("/stats", async (c) => {
  const auth = c.get("auth");
  const stats = await pomodoroService.getStats(auth.profileId);
  return c.json(ok(stats));
});

// ── GET /pomodoro/suggest — AI task suggestion for next session ──
pomodoroRoutes.get("/suggest", async (c) => {
  const auth = c.get("auth");
  const suggestion = await pomodoroService.suggestNextTask(auth.profileId);
  return c.json(ok(suggestion));
});

// ── GET /pomodoro/history — Recent session history ──
pomodoroRoutes.get("/history", async (c) => {
  const auth = c.get("auth");
  const rawLimit = parseInt(c.req.query("limit") ?? "10", 10);
  const limit = Number.isNaN(rawLimit) ? 10 : Math.min(Math.max(rawLimit, 1), 100);
  const sessions = await pomodoroService.getRecentSessions(auth.profileId, limit);
  return c.json(ok(sessions));
});
