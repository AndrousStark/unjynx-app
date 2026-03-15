import { Hono } from "hono";
import { zValidator } from "@hono/zod-validator";
import { authMiddleware } from "../../middleware/auth.js";
import { ok, err, paginated } from "../../types/api.js";
import {
  createProjectSchema,
  updateProjectSchema,
  projectQuerySchema,
} from "./projects.schema.js";
import * as projectService from "./projects.service.js";

export const projectRoutes = new Hono();

projectRoutes.use("/*", authMiddleware);

// GET /api/v1/projects
projectRoutes.get("/", zValidator("query", projectQuerySchema), async (c) => {
  const auth = c.get("auth");
  const query = c.req.valid("query");
  const { items, total } = await projectService.getProjects(
    auth.profileId,
    query,
  );
  return c.json(paginated(items, total, query.page, query.limit));
});

// GET /api/v1/projects/:id
projectRoutes.get("/:id", async (c) => {
  const auth = c.get("auth");
  const project = await projectService.getProjectById(
    auth.profileId,
    c.req.param("id"),
  );

  if (!project) {
    return c.json(err("Project not found"), 404);
  }

  return c.json(ok(project));
});

// POST /api/v1/projects
projectRoutes.post(
  "/",
  zValidator("json", createProjectSchema),
  async (c) => {
    const auth = c.get("auth");
    const input = c.req.valid("json");
    const project = await projectService.createProject(auth.profileId, input);

    return c.json(ok(project), 201);
  },
);

// PATCH /api/v1/projects/:id
projectRoutes.patch(
  "/:id",
  zValidator("json", updateProjectSchema),
  async (c) => {
    const auth = c.get("auth");
    const input = c.req.valid("json");
    const project = await projectService.updateProject(
      auth.profileId,
      c.req.param("id"),
      input,
    );

    if (!project) {
      return c.json(err("Project not found"), 404);
    }

    return c.json(ok(project));
  },
);

// DELETE /api/v1/projects/:id
projectRoutes.delete("/:id", async (c) => {
  const auth = c.get("auth");
  const deleted = await projectService.deleteProject(
    auth.profileId,
    c.req.param("id"),
  );

  if (!deleted) {
    return c.json(err("Project not found"), 404);
  }

  return c.json(ok({ deleted: true }));
});
