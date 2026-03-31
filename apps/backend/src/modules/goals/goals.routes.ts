import { Hono } from "hono";
import { z } from "zod";
import { zValidator } from "@hono/zod-validator";
import { authMiddleware } from "../../middleware/auth.js";
import { tenantMiddleware, requireOrgRole } from "../../middleware/tenant.js";
import { ok, err } from "../../types/api.js";
import * as goalsService from "./goals.service.js";

export const goalRoutes = new Hono();

goalRoutes.use("/*", authMiddleware);
goalRoutes.use("/*", tenantMiddleware);

// ── Schemas ──────────────────────────────────────────────────────────

const createGoalSchema = z.object({
  title: z.string().min(1).max(200),
  description: z.string().max(2000).optional(),
  parentId: z.string().uuid().optional(),
  ownerId: z.string().uuid().optional(),
  targetValue: z.string().optional(),
  unit: z.string().max(20).optional(),
  level: z.enum(["company", "team", "individual"]).optional(),
  dueDate: z.string().datetime().optional(),
});

const updateGoalSchema = z.object({
  title: z.string().min(1).max(200).optional(),
  description: z.string().max(2000).optional(),
  ownerId: z.string().uuid().optional(),
  targetValue: z.string().optional(),
  currentValue: z.string().optional(),
  unit: z.string().max(20).optional(),
  status: z.enum(["on_track", "at_risk", "behind", "completed", "cancelled"]).optional(),
  dueDate: z.string().datetime().optional(),
});

const listGoalsSchema = z.object({
  level: z.enum(["company", "team", "individual"]).optional(),
  ownerId: z.string().uuid().optional(),
  parentId: z.string().uuid().optional(),
});

// ── Goal CRUD ────────────────────────────────────────────────────────

// POST /goals — Create goal (member+)
goalRoutes.post(
  "/",
  requireOrgRole("member"),
  zValidator("json", createGoalSchema),
  async (c) => {
    const tenant = c.get("tenant");
    if (!tenant.orgId) return c.json(err("Organization context required"), 400);

    const input = c.req.valid("json");
    try {
      const goal = await goalsService.createGoal(tenant.orgId, input);
      return c.json(ok(goal), 201);
    } catch (e) {
      return c.json(err((e as Error).message), 400);
    }
  },
);

// GET /goals — List goals with filters
goalRoutes.get(
  "/",
  zValidator("query", listGoalsSchema),
  async (c) => {
    const tenant = c.get("tenant");
    if (!tenant.orgId) return c.json(err("Organization context required"), 400);

    const filters = c.req.valid("query");
    const list = await goalsService.getGoals(tenant.orgId, filters);
    return c.json(ok(list));
  },
);

// GET /goals/tree — Full goal hierarchy (Company → Team → Individual)
goalRoutes.get("/tree", async (c) => {
  const tenant = c.get("tenant");
  if (!tenant.orgId) return c.json(err("Organization context required"), 400);

  const tree = await goalsService.getGoalTree(tenant.orgId);
  return c.json(ok(tree));
});

// GET /goals/:id — Get single goal
goalRoutes.get("/:id", async (c) => {
  const goal = await goalsService.getGoal(c.req.param("id"));
  if (!goal) return c.json(err("Goal not found"), 404);
  return c.json(ok(goal));
});

// PATCH /goals/:id — Update goal (member+)
goalRoutes.patch(
  "/:id",
  requireOrgRole("member"),
  zValidator("json", updateGoalSchema),
  async (c) => {
    const input = c.req.valid("json");
    try {
      const goal = await goalsService.updateGoal(c.req.param("id"), input);
      return c.json(ok(goal));
    } catch (e) {
      return c.json(err((e as Error).message), 400);
    }
  },
);

// DELETE /goals/:id — Archive goal (manager+)
goalRoutes.delete(
  "/:id",
  requireOrgRole("manager"),
  async (c) => {
    await goalsService.archiveGoal(c.req.param("id"));
    return c.json(ok({ archived: true }));
  },
);

// ── Goal ↔ Task Links ────────────────────────────────────────────────

// GET /goals/:id/tasks — List linked tasks
goalRoutes.get("/:id/tasks", async (c) => {
  const linkedTasks = await goalsService.getGoalTasks(c.req.param("id"));
  return c.json(ok(linkedTasks));
});

// POST /goals/:id/tasks — Link a task to goal (member+)
goalRoutes.post(
  "/:id/tasks",
  requireOrgRole("member"),
  zValidator("json", z.object({ taskId: z.string().uuid() })),
  async (c) => {
    const tenant = c.get("tenant");
    if (!tenant.orgId) return c.json(err("Organization context required"), 400);

    const { taskId } = c.req.valid("json");
    const link = await goalsService.linkTaskToGoal(tenant.orgId, c.req.param("id"), taskId);
    return c.json(ok(link), 201);
  },
);

// DELETE /goals/:id/tasks/:taskId — Unlink a task (member+)
goalRoutes.delete(
  "/:id/tasks/:taskId",
  requireOrgRole("member"),
  async (c) => {
    await goalsService.unlinkTaskFromGoal(c.req.param("id"), c.req.param("taskId"));
    return c.json(ok({ unlinked: true }));
  },
);

// POST /goals/:id/recalculate — Force recalculate progress
goalRoutes.post("/:id/recalculate", async (c) => {
  await goalsService.recalculateGoalProgress(c.req.param("id"));
  const goal = await goalsService.getGoal(c.req.param("id"));
  return c.json(ok(goal));
});
