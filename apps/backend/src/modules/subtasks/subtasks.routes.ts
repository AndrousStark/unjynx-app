import { Hono } from "hono";
import { zValidator } from "@hono/zod-validator";
import { authMiddleware } from "../../middleware/auth.js";
import { ok, err, paginated } from "../../types/api.js";
import {
  createSubtaskSchema,
  updateSubtaskSchema,
  reorderSubtasksSchema,
  subtaskQuerySchema,
} from "./subtasks.schema.js";
import * as subtaskService from "./subtasks.service.js";

export const subtaskRoutes = new Hono();

subtaskRoutes.use("/*", authMiddleware);

// GET /api/v1/tasks/:taskId/subtasks
subtaskRoutes.get("/", zValidator("query", subtaskQuerySchema), async (c) => {
  const auth = c.get("auth");
  const taskId = c.req.param("taskId")!;
  const query = c.req.valid("query");
  const { items, total } = await subtaskService.getSubtasks(
    auth.profileId,
    taskId,
    query,
  );

  return c.json(paginated(items, total, query.page, query.limit));
});

// POST /api/v1/tasks/:taskId/subtasks
subtaskRoutes.post("/", zValidator("json", createSubtaskSchema), async (c) => {
  const auth = c.get("auth");
  const taskId = c.req.param("taskId")!;
  const input = c.req.valid("json");
  const subtask = await subtaskService.createSubtask(
    auth.profileId,
    taskId,
    input,
  );

  if (!subtask) {
    return c.json(err("Task not found"), 404);
  }

  return c.json(ok(subtask), 201);
});

// PATCH /api/v1/tasks/:taskId/subtasks/:subId
subtaskRoutes.patch(
  "/:subId",
  zValidator("json", updateSubtaskSchema),
  async (c) => {
    const auth = c.get("auth");
    const input = c.req.valid("json");
    const subtask = await subtaskService.updateSubtask(
      auth.profileId,
      c.req.param("subId")!,
      input,
    );

    if (!subtask) {
      return c.json(err("Subtask not found"), 404);
    }

    return c.json(ok(subtask));
  },
);

// DELETE /api/v1/tasks/:taskId/subtasks/:subId
subtaskRoutes.delete("/:subId", async (c) => {
  const auth = c.get("auth");
  const deleted = await subtaskService.deleteSubtask(
    auth.profileId,
    c.req.param("subId")!,
  );

  if (!deleted) {
    return c.json(err("Subtask not found"), 404);
  }

  return c.json(ok({ deleted: true }));
});

// POST /api/v1/tasks/:taskId/subtasks/reorder
subtaskRoutes.post(
  "/reorder",
  zValidator("json", reorderSubtasksSchema),
  async (c) => {
    const auth = c.get("auth");
    const taskId = c.req.param("taskId")!;
    const input = c.req.valid("json");
    const reordered = await subtaskService.reorderSubtasks(
      auth.profileId,
      taskId,
      input,
    );

    if (!reordered) {
      return c.json(err("Task not found or invalid subtask IDs"), 400);
    }

    return c.json(ok({ reordered: true }));
  },
);

// GET /api/v1/tasks/:taskId/subtasks/progress
subtaskRoutes.get("/progress", async (c) => {
  const auth = c.get("auth");
  const taskId = c.req.param("taskId")!;
  const progress = await subtaskService.getSubtaskProgress(
    auth.profileId,
    taskId,
  );

  return c.json(ok(progress));
});
