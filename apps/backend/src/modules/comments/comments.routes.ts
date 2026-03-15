import { Hono } from "hono";
import { zValidator } from "@hono/zod-validator";
import { authMiddleware } from "../../middleware/auth.js";
import { ok, err, paginated } from "../../types/api.js";
import {
  createCommentSchema,
  updateCommentSchema,
  commentQuerySchema,
} from "./comments.schema.js";
import * as commentService from "./comments.service.js";

export const commentRoutes = new Hono();

commentRoutes.use("/*", authMiddleware);

// GET /api/v1/tasks/:taskId/comments
commentRoutes.get("/", zValidator("query", commentQuerySchema), async (c) => {
  const taskId = c.req.param("taskId")!;
  const query = c.req.valid("query");
  const { items, total } = await commentService.getComments(taskId, query);

  return c.json(paginated(items, total, query.page, query.limit));
});

// POST /api/v1/tasks/:taskId/comments
commentRoutes.post("/", zValidator("json", createCommentSchema), async (c) => {
  const auth = c.get("auth");
  const taskId = c.req.param("taskId")!;
  const input = c.req.valid("json");
  const comment = await commentService.createComment(
    auth.profileId,
    taskId,
    input,
  );

  return c.json(ok(comment), 201);
});

// PATCH /api/v1/tasks/:taskId/comments/:commentId
commentRoutes.patch(
  "/:commentId",
  zValidator("json", updateCommentSchema),
  async (c) => {
    const auth = c.get("auth");
    const input = c.req.valid("json");
    const comment = await commentService.updateComment(
      auth.profileId,
      c.req.param("commentId")!,
      input,
    );

    if (!comment) {
      return c.json(err("Comment not found"), 404);
    }

    return c.json(ok(comment));
  },
);

// DELETE /api/v1/tasks/:taskId/comments/:commentId
commentRoutes.delete("/:commentId", async (c) => {
  const auth = c.get("auth");
  const deleted = await commentService.deleteComment(
    auth.profileId,
    c.req.param("commentId")!,
  );

  if (!deleted) {
    return c.json(err("Comment not found"), 404);
  }

  return c.json(ok({ deleted: true }));
});
