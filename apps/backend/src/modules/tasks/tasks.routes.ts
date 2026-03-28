import { Hono } from "hono";
import { zValidator } from "@hono/zod-validator";
import { authMiddleware } from "../../middleware/auth.js";
import { ok, err, paginated } from "../../types/api.js";
import {
  createTaskSchema,
  updateTaskSchema,
  taskQuerySchema,
  bulkCreateTasksSchema,
  bulkUpdateTasksSchema,
  bulkDeleteTasksSchema,
  snoozeTaskSchema,
  moveTaskSchema,
  cursorQuerySchema,
  calendarQuerySchema,
} from "./tasks.schema.js";
import * as taskService from "./tasks.service.js";

export const taskRoutes = new Hono();

taskRoutes.use("/*", authMiddleware);

// ── Bulk & Cursor routes (MUST come before /:id to avoid path conflicts) ──

// POST /api/v1/tasks/bulk - Bulk create tasks
taskRoutes.post(
  "/bulk",
  zValidator("json", bulkCreateTasksSchema),
  async (c) => {
    const auth = c.get("auth");
    const { tasks } = c.req.valid("json");
    const created = await taskService.bulkCreateTasks(auth.profileId, tasks);

    return c.json(ok(created), 201);
  },
);

// PATCH /api/v1/tasks/bulk - Bulk update tasks
taskRoutes.patch(
  "/bulk",
  zValidator("json", bulkUpdateTasksSchema),
  async (c) => {
    const auth = c.get("auth");
    const { tasks } = c.req.valid("json");
    const updated = await taskService.bulkUpdateTasks(auth.profileId, tasks);

    return c.json(ok(updated));
  },
);

// DELETE /api/v1/tasks/bulk - Bulk delete tasks
taskRoutes.delete(
  "/bulk",
  zValidator("json", bulkDeleteTasksSchema),
  async (c) => {
    const auth = c.get("auth");
    const { ids } = c.req.valid("json");
    const deletedCount = await taskService.bulkDeleteTasks(
      auth.profileId,
      ids,
    );

    return c.json(ok({ deleted: deletedCount }));
  },
);

// GET /api/v1/tasks/cursor - Cursor-based pagination
taskRoutes.get(
  "/cursor",
  zValidator("query", cursorQuerySchema),
  async (c) => {
    const auth = c.get("auth");
    const query = c.req.valid("query");
    const result = await taskService.getTasksWithCursor(
      auth.profileId,
      query,
    );

    return c.json(ok(result));
  },
);

// GET /api/v1/tasks/calendar - Calendar view (tasks by date range)
taskRoutes.get(
  "/calendar",
  zValidator("query", calendarQuerySchema),
  async (c) => {
    const auth = c.get("auth");
    const { start, end } = c.req.valid("query");
    const tasks = await taskService.getTasksForCalendar(
      auth.profileId,
      start,
      end,
    );

    return c.json(ok(tasks));
  },
);

// ── Standard CRUD routes ───────────────────────────────────────────────

// GET /api/v1/tasks
taskRoutes.get("/", zValidator("query", taskQuerySchema), async (c) => {
  const auth = c.get("auth");
  const query = c.req.valid("query");
  const { items, total } = await taskService.getTasks(auth.profileId, query);

  return c.json(paginated(items, total, query.page, query.limit));
});

// POST /api/v1/tasks
taskRoutes.post("/", zValidator("json", createTaskSchema), async (c) => {
  const auth = c.get("auth");
  const input = c.req.valid("json");

  // Check feature gate (enforces plan-based task limits: free=25, pro=unlimited)
  const { checkAccess } = await import("../../middleware/access-gate.js");
  const role = (auth.adminRole ?? "member") as "owner" | "admin" | "member" | "viewer" | "guest";
  const access = await checkAccess(auth.profileId, role, "tasks.create");
  if (!access.allowed) {
    return c.json({
      success: false, data: null, error: access.reason,
      requiredPlan: access.requiredPlan, upgradeUrl: access.upgradeUrl,
    }, 403);
  }

  // Enforce task count limit if set
  if (access.limit) {
    const count = await taskService.getTaskCount(auth.profileId);
    if (count >= access.limit) {
      return c.json({
        success: false, data: null,
        error: `You've reached your plan limit of ${access.limit} tasks. Upgrade to create more.`,
        requiredPlan: "pro", upgradeUrl: "/billing/upgrade",
      }, 403);
    }
  }

  const task = await taskService.createTask(auth.profileId, input);

  // Invalidate AI cache — task list/progress responses are now stale
  import("../ai/pipeline/exact-cache.js").then((m) => m.invalidateUserCache(auth.profileId)).catch(() => {});

  return c.json(ok(task), 201);
});

// GET /api/v1/tasks/:id
taskRoutes.get("/:id", async (c) => {
  const auth = c.get("auth");
  const task = await taskService.getTaskById(auth.profileId, c.req.param("id"));

  if (!task) {
    return c.json(err("Task not found"), 404);
  }

  return c.json(ok(task));
});

// PATCH /api/v1/tasks/:id
taskRoutes.patch(
  "/:id",
  zValidator("json", updateTaskSchema),
  async (c) => {
    const auth = c.get("auth");
    const input = c.req.valid("json");
    const task = await taskService.updateTask(
      auth.profileId,
      c.req.param("id"),
      input,
    );

    if (!task) {
      return c.json(err("Task not found"), 404);
    }

    // Invalidate AI cache on task update
    import("../ai/pipeline/exact-cache.js").then((m) => m.invalidateUserCache(auth.profileId)).catch(() => {});

    return c.json(ok(task));
  },
);

// DELETE /api/v1/tasks/:id
taskRoutes.delete("/:id", async (c) => {
  const auth = c.get("auth");
  const deleted = await taskService.deleteTask(
    auth.profileId,
    c.req.param("id"),
  );

  if (!deleted) {
    return c.json(err("Task not found"), 404);
  }

  // Invalidate AI cache on task delete
  import("../ai/pipeline/exact-cache.js").then((m) => m.invalidateUserCache(auth.profileId)).catch(() => {});

  return c.json(ok({ deleted: true }));
});

// ── Task Action routes ─────────────────────────────────────────────────

// POST /api/v1/tasks/:id/complete - Mark task as completed
taskRoutes.post("/:id/complete", async (c) => {
  const auth = c.get("auth");
  const task = await taskService.completeTask(
    auth.profileId,
    c.req.param("id"),
  );

  if (!task) {
    return c.json(err("Task not found"), 404);
  }

  // Invalidate AI cache on task completion
  import("../ai/pipeline/exact-cache.js").then((m) => m.invalidateUserCache(auth.profileId)).catch(() => {});

  return c.json(ok(task));
});

// POST /api/v1/tasks/:id/uncomplete - Revert task completion
taskRoutes.post("/:id/uncomplete", async (c) => {
  const auth = c.get("auth");
  const task = await taskService.uncompleteTask(
    auth.profileId,
    c.req.param("id"),
  );

  if (!task) {
    return c.json(err("Task not found"), 404);
  }

  return c.json(ok(task));
});

// POST /api/v1/tasks/:id/snooze - Snooze task
taskRoutes.post(
  "/:id/snooze",
  zValidator("json", snoozeTaskSchema),
  async (c) => {
    const auth = c.get("auth");
    const { minutes } = c.req.valid("json");
    const task = await taskService.snoozeTask(
      auth.profileId,
      c.req.param("id"),
      minutes,
    );

    if (!task) {
      return c.json(err("Task not found"), 404);
    }

    return c.json(ok(task));
  },
);

// POST /api/v1/tasks/:id/move - Move task to a different project
taskRoutes.post(
  "/:id/move",
  zValidator("json", moveTaskSchema),
  async (c) => {
    const auth = c.get("auth");
    const { projectId } = c.req.valid("json");
    const task = await taskService.moveTask(
      auth.profileId,
      c.req.param("id"),
      projectId,
    );

    if (!task) {
      return c.json(err("Task not found"), 404);
    }

    return c.json(ok(task));
  },
);

// POST /api/v1/tasks/:id/duplicate - Duplicate a task
taskRoutes.post("/:id/duplicate", async (c) => {
  const auth = c.get("auth");
  const task = await taskService.duplicateTask(
    auth.profileId,
    c.req.param("id"),
  );

  if (!task) {
    return c.json(err("Task not found"), 404);
  }

  return c.json(ok(task), 201);
});
