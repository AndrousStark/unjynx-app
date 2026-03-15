import { Hono } from "hono";
import { zValidator } from "@hono/zod-validator";
import { authMiddleware } from "../../middleware/auth.js";
import { ok, err } from "../../types/api.js";
import {
  createSectionSchema,
  updateSectionSchema,
  reorderSectionsSchema,
} from "./sections.schema.js";
import * as sectionService from "./sections.service.js";

export const sectionRoutes = new Hono();

sectionRoutes.use("/*", authMiddleware);

// GET /api/v1/projects/:projectId/sections
sectionRoutes.get("/", async (c) => {
  const auth = c.get("auth");
  const projectId = c.req.param("projectId")!;

  try {
    const sections = await sectionService.getSections(
      auth.profileId,
      projectId,
    );
    return c.json(ok(sections));
  } catch {
    return c.json(err("Project not found"), 404);
  }
});

// POST /api/v1/projects/:projectId/sections
sectionRoutes.post(
  "/",
  zValidator("json", createSectionSchema),
  async (c) => {
    const auth = c.get("auth");
    const projectId = c.req.param("projectId")!;
    const input = c.req.valid("json");

    try {
      const section = await sectionService.createSection(
        auth.profileId,
        projectId,
        input,
      );
      return c.json(ok(section), 201);
    } catch {
      return c.json(err("Project not found"), 404);
    }
  },
);

// PATCH /api/v1/projects/:projectId/sections/:secId
sectionRoutes.patch(
  "/:secId",
  zValidator("json", updateSectionSchema),
  async (c) => {
    const auth = c.get("auth");
    const projectId = c.req.param("projectId")!;
    const secId = c.req.param("secId")!;
    const input = c.req.valid("json");

    try {
      const section = await sectionService.updateSection(
        auth.profileId,
        projectId,
        secId,
        input,
      );

      if (!section) {
        return c.json(err("Section not found"), 404);
      }

      return c.json(ok(section));
    } catch {
      return c.json(err("Project not found"), 404);
    }
  },
);

// DELETE /api/v1/projects/:projectId/sections/:secId
sectionRoutes.delete("/:secId", async (c) => {
  const auth = c.get("auth");
  const projectId = c.req.param("projectId")!;
  const secId = c.req.param("secId")!;

  try {
    const deleted = await sectionService.deleteSection(
      auth.profileId,
      projectId,
      secId,
    );

    if (!deleted) {
      return c.json(err("Section not found"), 404);
    }

    return c.json(ok({ deleted: true }));
  } catch {
    return c.json(err("Project not found"), 404);
  }
});

// POST /api/v1/projects/:projectId/sections/reorder
sectionRoutes.post(
  "/reorder",
  zValidator("json", reorderSectionsSchema),
  async (c) => {
    const auth = c.get("auth");
    const projectId = c.req.param("projectId")!;
    const input = c.req.valid("json");

    try {
      await sectionService.reorderSections(auth.profileId, projectId, input);
      return c.json(ok({ reordered: true }));
    } catch {
      return c.json(err("Project not found"), 404);
    }
  },
);
