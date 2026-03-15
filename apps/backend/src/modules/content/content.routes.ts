import { Hono } from "hono";
import { zValidator } from "@hono/zod-validator";
import { authMiddleware } from "../../middleware/auth.js";
import { ok, err, paginated } from "../../types/api.js";
import {
  contentTodayQuerySchema,
  saveContentSchema,
  updatePrefsSchema,
  logRitualSchema,
  ritualHistorySchema,
} from "./content.schema.js";
import * as contentService from "./content.service.js";

export const contentRoutes = new Hono();

contentRoutes.use("/*", authMiddleware);

// GET /api/v1/content/today
contentRoutes.get(
  "/today",
  zValidator("query", contentTodayQuerySchema),
  async (c) => {
    const auth = c.get("auth");
    const query = c.req.valid("query");
    const content = await contentService.getTodayContent(
      auth.profileId,
      query,
    );

    if (!content) {
      return c.json(err("No content available"), 404);
    }

    return c.json(ok(content));
  },
);

// GET /api/v1/content/categories
contentRoutes.get("/categories", async (c) => {
  const categories = await contentService.getCategories();
  return c.json(ok(categories));
});

// POST /api/v1/content/save
contentRoutes.post(
  "/save",
  zValidator("json", saveContentSchema),
  async (c) => {
    const auth = c.get("auth");
    const { contentId } = c.req.valid("json");
    const result = await contentService.saveContent(auth.profileId, contentId);

    if (!result.saved) {
      return c.json(err("Content not found"), 404);
    }

    return c.json(ok(result));
  },
);

// GET /api/v1/content/preferences
contentRoutes.get("/preferences", async (c) => {
  const auth = c.get("auth");
  const prefs = await contentService.getPreferences(auth.profileId);
  return c.json(ok(prefs));
});

// PUT /api/v1/content/preferences
contentRoutes.put(
  "/preferences",
  zValidator("json", updatePrefsSchema),
  async (c) => {
    const auth = c.get("auth");
    const input = c.req.valid("json");
    const prefs = await contentService.updatePreferences(
      auth.profileId,
      input,
    );
    return c.json(ok(prefs));
  },
);

// POST /api/v1/content/rituals
contentRoutes.post(
  "/rituals",
  zValidator("json", logRitualSchema),
  async (c) => {
    const auth = c.get("auth");
    const input = c.req.valid("json");
    const result = await contentService.logRitual(auth.profileId, input);
    return c.json(ok(result), 201);
  },
);

// GET /api/v1/content/rituals/history
contentRoutes.get(
  "/rituals/history",
  zValidator("query", ritualHistorySchema),
  async (c) => {
    const auth = c.get("auth");
    const query = c.req.valid("query");
    const { items, total } = await contentService.getRitualHistory(
      auth.profileId,
      query,
    );

    return c.json(paginated(items, total, query.page, query.limit));
  },
);
