import { Hono } from "hono";
import { zValidator } from "@hono/zod-validator";
import { authMiddleware } from "../../middleware/auth.js";
import { ok, err } from "../../types/api.js";
import { setRecurrenceSchema, occurrencesQuerySchema } from "./recurring.schema.js";
import * as recurringService from "./recurring.service.js";

// ── Recurrence CRUD routes (mounted at /api/v1/tasks/:id/recurrence) ──

export const recurringRoutes = new Hono();

recurringRoutes.use("/*", authMiddleware);

// GET /api/v1/tasks/:id/recurrence - Get recurrence rule for a task
recurringRoutes.get("/", async (c) => {
  const auth = c.get("auth");
  const taskId = c.req.param("id")!;
  const rule = await recurringService.getRecurrence(taskId, auth.profileId);

  if (!rule) {
    return c.json(err("Recurrence rule not found"), 404);
  }

  return c.json(ok(rule));
});

// PUT /api/v1/tasks/:id/recurrence - Set or update recurrence rule
recurringRoutes.put(
  "/",
  zValidator("json", setRecurrenceSchema),
  async (c) => {
    const auth = c.get("auth");
    const taskId = c.req.param("id")!;
    const { rrule } = c.req.valid("json");

    try {
      const rule = await recurringService.setRecurrence(
        taskId,
        auth.profileId,
        rrule,
      );

      if (!rule) {
        return c.json(err("Task not found"), 404);
      }

      return c.json(ok(rule));
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Failed to set recurrence";
      return c.json(err(message), 400);
    }
  },
);

// DELETE /api/v1/tasks/:id/recurrence - Remove recurrence rule
recurringRoutes.delete("/", async (c) => {
  const auth = c.get("auth");
  const taskId = c.req.param("id")!;
  const deleted = await recurringService.removeRecurrence(
    taskId,
    auth.profileId,
  );

  if (!deleted) {
    return c.json(err("Recurrence rule not found"), 404);
  }

  return c.json(ok({ deleted: true }));
});

// ── Occurrences route (mounted at /api/v1/tasks/:id/occurrences) ──────

export const occurrencesRoutes = new Hono();

occurrencesRoutes.use("/*", authMiddleware);

// GET /api/v1/tasks/:id/occurrences?count=5 - Preview next N occurrences
occurrencesRoutes.get(
  "/",
  zValidator("query", occurrencesQuerySchema),
  async (c) => {
    const auth = c.get("auth");
    const taskId = c.req.param("id")!;
    const { count } = c.req.valid("query");

    const occurrences = await recurringService.getOccurrences(
      taskId,
      auth.profileId,
      count,
    );

    if (!occurrences) {
      return c.json(err("Recurrence rule not found"), 404);
    }

    return c.json(ok({ occurrences }));
  },
);
