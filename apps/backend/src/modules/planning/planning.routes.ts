// ── Daily Planning API Routes ─────────────────────────────────────────

import { Hono } from "hono";
import { zValidator } from "@hono/zod-validator";
import { z } from "zod";
import { authMiddleware } from "../../middleware/auth.js";
import { ok, err } from "../../types/api.js";
import * as planningService from "./planning.service.js";
import { getTodayCalendarContext } from "../calendar/calendar-context.js";

export const planningRoutes = new Hono();

planningRoutes.use("/*", authMiddleware);

// ── GET /planning/yesterday — Yesterday's summary for morning review ──
planningRoutes.get("/yesterday", async (c) => {
  const auth = c.get("auth");
  const summary = await planningService.getYesterdaySummary(auth.profileId);
  return c.json(ok(summary));
});

// ── GET /planning/suggestions — AI task suggestions for today ──
planningRoutes.get("/suggestions", async (c) => {
  const auth = c.get("auth");
  const suggestions = await planningService.getPlanSuggestions(auth.profileId);
  return c.json(ok(suggestions));
});

// ── POST /planning/generate — Generate a time-blocked schedule ──
const generateSchema = z.object({
  tasks: z.array(z.object({
    id: z.string(),
    title: z.string(),
    priority: z.string(),
    estimatedMinutes: z.number().min(5).max(480),
  })).min(1).max(20),
  workStartHour: z.number().min(0).max(23).optional(),
  workEndHour: z.number().min(1).max(24).optional(),
}).refine(
  (d) => !d.workStartHour || !d.workEndHour || d.workStartHour < d.workEndHour,
  { message: "workStartHour must be before workEndHour" },
);

planningRoutes.post(
  "/generate",
  zValidator("json", generateSchema),
  async (c) => {
    const body = c.req.valid("json");
    const blocks = planningService.generateSchedule(
      body.tasks,
      body.workStartHour,
      body.workEndHour,
    );
    return c.json(ok({ blocks, totalMinutes: blocks.reduce((s, b) => s + b.estimatedMinutes, 0) }));
  },
);

// ── POST /planning/commit — Lock in the plan and activate ──
const commitSchema = z.object({
  blocks: z.array(z.object({
    taskId: z.string(),
    taskTitle: z.string(),
    priority: z.string(),
    startTime: z.string(),
    endTime: z.string(),
    estimatedMinutes: z.number(),
    status: z.enum(["pending", "active", "completed", "skipped", "carried"]),
    position: z.number(),
  })).min(1),
  mode: z.enum(["guided", "quick", "auto"]).optional(),
});

planningRoutes.post(
  "/commit",
  zValidator("json", commitSchema),
  async (c) => {
    const auth = c.get("auth");
    const body = c.req.valid("json");
    const plan = await planningService.createPlan(
      auth.profileId,
      body.blocks,
      body.mode,
    );
    return c.json(ok(plan), 201);
  },
);

// ── GET /planning/today — Get today's active plan ──
planningRoutes.get("/today", async (c) => {
  const auth = c.get("auth");
  const plan = await planningService.getTodayPlan(auth.profileId);
  if (!plan) {
    return c.json(ok(null));
  }
  return c.json(ok(plan));
});

// ── POST /planning/complete-block — Mark a block as completed ──
const completeBlockSchema = z.object({
  taskId: z.string(),
  actualMinutes: z.number().min(1).max(960).optional(),
});

planningRoutes.post(
  "/complete-block",
  zValidator("json", completeBlockSchema),
  async (c) => {
    const auth = c.get("auth");
    const body = c.req.valid("json");
    const plan = planningService.completeBlock(
      auth.profileId,
      body.taskId,
      body.actualMinutes,
    );
    if (!plan) {
      return c.json(err("No active plan found"), 404);
    }
    return c.json(ok(plan));
  },
);

// ── POST /planning/skip-block — Skip a block ──
const skipBlockSchema = z.object({
  taskId: z.string(),
});

planningRoutes.post(
  "/skip-block",
  zValidator("json", skipBlockSchema),
  async (c) => {
    const auth = c.get("auth");
    const body = c.req.valid("json");
    const plan = planningService.skipBlock(auth.profileId, body.taskId);
    if (!plan) {
      return c.json(err("No active plan found"), 404);
    }
    return c.json(ok(plan));
  },
);

// ── GET /planning/review — Evening review data ──
planningRoutes.get("/review", async (c) => {
  const auth = c.get("auth");
  const review = await planningService.getEveningReview(auth.profileId);
  return c.json(ok(review));
});

// ── POST /planning/carry-forward — Move incomplete tasks to tomorrow ──
const carrySchema = z.object({
  taskIds: z.array(z.string()).min(1).max(50),
});

planningRoutes.post(
  "/carry-forward",
  zValidator("json", carrySchema),
  async (c) => {
    const auth = c.get("auth");
    const body = c.req.valid("json");
    const carried = await planningService.carryForward(auth.profileId, body.taskIds);
    return c.json(ok({ carried, total: body.taskIds.length }));
  },
);

// ── GET /planning/calendar — Today's calendar context ──
planningRoutes.get("/calendar", async (c) => {
  const auth = c.get("auth");
  try {
    const ctx = await getTodayCalendarContext(auth.profileId);
    return c.json(ok(ctx));
  } catch {
    return c.json(ok({
      events: [],
      availableSlots: [],
      totalMeetingMinutes: 0,
      totalAvailableMinutes: 360,
      warnings: [],
      hasCalendar: false,
    }));
  }
});
