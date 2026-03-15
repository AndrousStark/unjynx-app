import { Hono } from "hono";
import { zValidator } from "@hono/zod-validator";
import { authMiddleware } from "../../middleware/auth.js";
import { ok, err, paginated } from "../../types/api.js";
import {
  createTagSchema,
  updateTagSchema,
  tagQuerySchema,
  addTagToTaskSchema,
} from "./tags.schema.js";
import * as tagService from "./tags.service.js";

// ── Tag CRUD Routes (/api/v1/tags) ──────────────────────────────────

export const tagRoutes = new Hono();

tagRoutes.use("/*", authMiddleware);

// GET /api/v1/tags
tagRoutes.get("/", zValidator("query", tagQuerySchema), async (c) => {
  const auth = c.get("auth");
  const query = c.req.valid("query");
  const { items, total } = await tagService.getTags(auth.profileId, query);

  return c.json(paginated(items, total, query.page, query.limit));
});

// POST /api/v1/tags
tagRoutes.post("/", zValidator("json", createTagSchema), async (c) => {
  const auth = c.get("auth");
  const input = c.req.valid("json");

  try {
    const tag = await tagService.createTag(auth.profileId, input);
    return c.json(ok(tag), 201);
  } catch (e) {
    const message = e instanceof Error ? e.message : "Failed to create tag";
    return c.json(err(message), 409);
  }
});

// GET /api/v1/tags/:id
tagRoutes.get("/:id", async (c) => {
  const auth = c.get("auth");
  const tag = await tagService.getTagById(auth.profileId, c.req.param("id"));

  if (!tag) {
    return c.json(err("Tag not found"), 404);
  }

  return c.json(ok(tag));
});

// PATCH /api/v1/tags/:id
tagRoutes.patch(
  "/:id",
  zValidator("json", updateTagSchema),
  async (c) => {
    const auth = c.get("auth");
    const input = c.req.valid("json");

    try {
      const tag = await tagService.updateTag(
        auth.profileId,
        c.req.param("id"),
        input,
      );

      if (!tag) {
        return c.json(err("Tag not found"), 404);
      }

      return c.json(ok(tag));
    } catch (e) {
      const message = e instanceof Error ? e.message : "Failed to update tag";
      return c.json(err(message), 409);
    }
  },
);

// DELETE /api/v1/tags/:id
tagRoutes.delete("/:id", async (c) => {
  const auth = c.get("auth");
  const deleted = await tagService.deleteTag(
    auth.profileId,
    c.req.param("id"),
  );

  if (!deleted) {
    return c.json(err("Tag not found"), 404);
  }

  return c.json(ok({ deleted: true }));
});

// ── Task-Tag Junction Routes (/api/v1/tasks/:taskId/tags) ───────────

export const taskTagRoutes = new Hono();

taskTagRoutes.use("/*", authMiddleware);

// GET /api/v1/tasks/:taskId/tags
taskTagRoutes.get("/", async (c) => {
  const taskId = c.req.param("taskId")!;
  const tags = await tagService.getTagsForTask(taskId);

  return c.json(ok(tags));
});

// POST /api/v1/tasks/:taskId/tags
taskTagRoutes.post(
  "/",
  zValidator("json", addTagToTaskSchema),
  async (c) => {
    const auth = c.get("auth");
    const taskId = c.req.param("taskId")!;
    const { tagId } = c.req.valid("json");

    try {
      const taskTag = await tagService.addTagToTask(
        auth.profileId,
        taskId,
        tagId,
      );
      return c.json(ok(taskTag), 201);
    } catch (e) {
      const message =
        e instanceof Error ? e.message : "Failed to add tag to task";
      return c.json(err(message), 400);
    }
  },
);

// DELETE /api/v1/tasks/:taskId/tags/:tagId
taskTagRoutes.delete("/:tagId", async (c) => {
  const auth = c.get("auth");
  const taskId = c.req.param("taskId")!;
  const tagId = c.req.param("tagId")!;

  try {
    const removed = await tagService.removeTagFromTask(
      auth.profileId,
      taskId,
      tagId,
    );

    if (!removed) {
      return c.json(err("Tag not associated with this task"), 404);
    }

    return c.json(ok({ deleted: true }));
  } catch (e) {
    const message =
      e instanceof Error ? e.message : "Failed to remove tag from task";
    return c.json(err(message), 400);
  }
});
