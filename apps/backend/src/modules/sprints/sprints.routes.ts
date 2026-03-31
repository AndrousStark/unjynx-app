import { Hono } from "hono";
import { z } from "zod";
import { zValidator } from "@hono/zod-validator";
import { authMiddleware } from "../../middleware/auth.js";
import { tenantMiddleware, requireOrgRole } from "../../middleware/tenant.js";
import { ok, err } from "../../types/api.js";
import * as sprintService from "./sprints.service.js";

export const sprintRoutes = new Hono();

sprintRoutes.use("/*", authMiddleware);
sprintRoutes.use("/*", tenantMiddleware);

// ── Schemas ──────────────────────────────────────────────────────────

const createSprintSchema = z.object({
  projectId: z.string().uuid(),
  name: z.string().min(1).max(100),
  goal: z.string().max(500).optional(),
  startDate: z.string().datetime().optional(),
  endDate: z.string().datetime().optional(),
});

const updateSprintSchema = z.object({
  name: z.string().min(1).max(100).optional(),
  goal: z.string().max(500).optional(),
  startDate: z.string().datetime().optional(),
  endDate: z.string().datetime().optional(),
});

const completeSprintSchema = z.object({
  moveIncompleteToSprintId: z.string().uuid().optional(),
});

const retroSchema = z.object({
  wentWell: z.string().max(2000).optional(),
  toImprove: z.string().max(2000).optional(),
  actionItems: z.array(z.string().max(500)).max(20).optional(),
});

const sprintTaskSchema = z.object({
  taskId: z.string().uuid(),
});

// ── Sprint CRUD ──────────────────────────────────────────────────────

// POST /sprints — Create sprint (member+)
sprintRoutes.post(
  "/",
  requireOrgRole("member"),
  zValidator("json", createSprintSchema),
  async (c) => {
    const tenant = c.get("tenant");
    if (!tenant.orgId) return c.json(err("Organization context required"), 400);

    const input = c.req.valid("json");
    try {
      const sprint = await sprintService.createSprint(
        tenant.orgId,
        input.projectId,
        input,
      );
      return c.json(ok(sprint), 201);
    } catch (e) {
      return c.json(err((e as Error).message), 400);
    }
  },
);

// GET /sprints?projectId=... — List sprints for a project
sprintRoutes.get(
  "/",
  zValidator("query", z.object({ projectId: z.string().uuid() })),
  async (c) => {
    const tenant = c.get("tenant");
    if (!tenant.orgId) return c.json(err("Organization context required"), 400);

    const { projectId } = c.req.valid("query");
    const list = await sprintService.getSprints(tenant.orgId, projectId);
    return c.json(ok(list));
  },
);

// GET /sprints/active?projectId=... — Get active sprint
sprintRoutes.get(
  "/active",
  zValidator("query", z.object({ projectId: z.string().uuid() })),
  async (c) => {
    const tenant = c.get("tenant");
    if (!tenant.orgId) return c.json(err("Organization context required"), 400);

    const { projectId } = c.req.valid("query");
    const sprint = await sprintService.getActiveSprint(tenant.orgId, projectId);
    return c.json(ok(sprint));
  },
);

// GET /sprints/:id — Get sprint detail
sprintRoutes.get("/:id", async (c) => {
  const sprint = await sprintService.getSprint(c.req.param("id"));
  if (!sprint) return c.json(err("Sprint not found"), 404);
  return c.json(ok(sprint));
});

// PATCH /sprints/:id — Update sprint (member+)
sprintRoutes.patch(
  "/:id",
  requireOrgRole("member"),
  zValidator("json", updateSprintSchema),
  async (c) => {
    const input = c.req.valid("json");
    try {
      const sprint = await sprintService.updateSprint(c.req.param("id"), input);
      return c.json(ok(sprint));
    } catch (e) {
      return c.json(err((e as Error).message), 400);
    }
  },
);

// ── Sprint Lifecycle ─────────────────────────────────────────────────

// POST /sprints/:id/start — Start sprint (manager+)
sprintRoutes.post(
  "/:id/start",
  requireOrgRole("manager"),
  async (c) => {
    const tenant = c.get("tenant");
    if (!tenant.orgId) return c.json(err("Organization context required"), 400);

    const sprint = await sprintService.getSprint(c.req.param("id"));
    if (!sprint) return c.json(err("Sprint not found"), 404);

    try {
      const started = await sprintService.startSprint(
        sprint.id,
        tenant.orgId,
        sprint.projectId,
      );
      return c.json(ok(started));
    } catch (e) {
      return c.json(err((e as Error).message), 400);
    }
  },
);

// POST /sprints/:id/complete — Complete sprint (manager+)
sprintRoutes.post(
  "/:id/complete",
  requireOrgRole("manager"),
  zValidator("json", completeSprintSchema),
  async (c) => {
    const input = c.req.valid("json");
    try {
      const result = await sprintService.completeSprint(
        c.req.param("id"),
        input.moveIncompleteToSprintId,
      );
      return c.json(ok(result));
    } catch (e) {
      return c.json(err((e as Error).message), 400);
    }
  },
);

// ── Sprint Tasks ─────────────────────────────────────────────────────

// GET /sprints/:id/tasks — List tasks in sprint
sprintRoutes.get("/:id/tasks", async (c) => {
  const taskList = await sprintService.getSprintTasks(c.req.param("id"));
  return c.json(ok(taskList));
});

// POST /sprints/:id/tasks — Add task to sprint (member+)
sprintRoutes.post(
  "/:id/tasks",
  requireOrgRole("member"),
  zValidator("json", sprintTaskSchema),
  async (c) => {
    const tenant = c.get("tenant");
    if (!tenant.orgId) return c.json(err("Organization context required"), 400);

    const { taskId } = c.req.valid("json");
    try {
      const entry = await sprintService.addTaskToSprint(
        c.req.param("id"),
        taskId,
        tenant.orgId,
      );
      return c.json(ok(entry), 201);
    } catch (e) {
      return c.json(err((e as Error).message), 400);
    }
  },
);

// DELETE /sprints/:id/tasks/:taskId — Remove task from sprint (member+)
sprintRoutes.delete(
  "/:id/tasks/:taskId",
  requireOrgRole("member"),
  async (c) => {
    try {
      await sprintService.removeTaskFromSprint(
        c.req.param("id"),
        c.req.param("taskId"),
      );
      return c.json(ok({ removed: true }));
    } catch (e) {
      return c.json(err((e as Error).message), 400);
    }
  },
);

// ── Burndown & Velocity ──────────────────────────────────────────────

// GET /sprints/:id/burndown — Get burndown chart data
sprintRoutes.get("/:id/burndown", async (c) => {
  const data = await sprintService.getBurndownData(c.req.param("id"));
  return c.json(ok(data));
});

// POST /sprints/:id/burndown/snapshot — Capture burndown snapshot (system/cron)
sprintRoutes.post("/:id/burndown/snapshot", async (c) => {
  const sprint = await sprintService.getSprint(c.req.param("id"));
  if (!sprint) return c.json(err("Sprint not found"), 404);

  const snapshot = await sprintService.captureBurndownSnapshot(
    sprint.id,
    sprint.orgId,
  );
  return c.json(ok(snapshot));
});

// GET /sprints/velocity?projectId=... — Velocity chart data
sprintRoutes.get(
  "/velocity",
  zValidator("query", z.object({
    projectId: z.string().uuid(),
    limit: z.coerce.number().int().min(1).max(50).default(10),
  })),
  async (c) => {
    const tenant = c.get("tenant");
    if (!tenant.orgId) return c.json(err("Organization context required"), 400);

    const { projectId, limit } = c.req.valid("query");
    const data = await sprintService.getVelocity(tenant.orgId, projectId, limit);
    return c.json(ok(data));
  },
);

// ── Retrospective ────────────────────────────────────────────────────

// POST /sprints/:id/retro — Save retrospective (member+)
sprintRoutes.post(
  "/:id/retro",
  requireOrgRole("member"),
  zValidator("json", retroSchema),
  async (c) => {
    const input = c.req.valid("json");
    try {
      const sprint = await sprintService.saveRetrospective(c.req.param("id"), input);
      return c.json(ok(sprint));
    } catch (e) {
      return c.json(err((e as Error).message), 400);
    }
  },
);
