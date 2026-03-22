import { Hono } from "hono";
import { zValidator } from "@hono/zod-validator";
import { authMiddleware } from "../../middleware/auth.js";
import { ok, err } from "../../types/api.js";
import { setActiveModeSchema } from "./modes.schema.js";
import * as modesService from "./modes.service.js";

export const modesRoutes = new Hono();

// GET /api/v1/modes - List all active modes (public)
modesRoutes.get("/", async (c) => {
  const modes = await modesService.getAllModes();
  return c.json(ok(modes));
});

// GET /api/v1/modes/active - Get user's active mode with vocabulary (authenticated)
modesRoutes.get("/active", authMiddleware, async (c) => {
  const auth = c.get("auth");
  const activeMode = await modesService.getActiveMode(auth.profileId);

  if (!activeMode) {
    return c.json(ok(null));
  }

  return c.json(ok(activeMode));
});

// PUT /api/v1/modes/active - Set user's active mode (authenticated)
modesRoutes.put(
  "/active",
  authMiddleware,
  zValidator("json", setActiveModeSchema),
  async (c) => {
    const auth = c.get("auth");
    const { slug } = c.req.valid("json");

    try {
      const result = await modesService.setActiveMode(auth.profileId, slug);
      return c.json(ok(result));
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Failed to set mode";
      return c.json(err(message), 400);
    }
  },
);

// GET /api/v1/modes/:slug - Get mode detail with vocabulary + templates
modesRoutes.get("/:slug", async (c) => {
  const slug = c.req.param("slug");

  // Prevent matching "active" as a slug (already handled above)
  if (slug === "active") {
    return c.json(err("Use GET /modes/active with auth"), 400);
  }

  const detail = await modesService.getModeBySlug(slug);

  if (!detail) {
    return c.json(err("Mode not found"), 404);
  }

  return c.json(ok(detail));
});

// GET /api/v1/modes/:slug/templates - Get templates only
modesRoutes.get("/:slug/templates", async (c) => {
  const slug = c.req.param("slug");
  const templates = await modesService.getModeTemplates(slug);

  if (!templates) {
    return c.json(err("Mode not found"), 404);
  }

  return c.json(ok(templates));
});
