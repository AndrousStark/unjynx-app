import { Hono } from "hono";
import { zValidator } from "@hono/zod-validator";
import { authMiddleware } from "../../middleware/auth.js";
import { ok } from "../../types/api.js";
import { heatmapQuerySchema } from "./progress.schema.js";
import * as progressService from "./progress.service.js";

export const progressRoutes = new Hono();

progressRoutes.use("/*", authMiddleware);

// GET /api/v1/progress/rings
progressRoutes.get("/rings", async (c) => {
  const auth = c.get("auth");
  const rings = await progressService.getRings(auth.profileId);
  return c.json(ok(rings));
});

// GET /api/v1/progress/streak
progressRoutes.get("/streak", async (c) => {
  const auth = c.get("auth");
  const streak = await progressService.getStreak(auth.profileId);
  return c.json(ok(streak));
});

// GET /api/v1/progress/heatmap
progressRoutes.get(
  "/heatmap",
  zValidator("query", heatmapQuerySchema),
  async (c) => {
    const auth = c.get("auth");
    const query = c.req.valid("query");
    const data = await progressService.getHeatmap(auth.profileId, query);
    return c.json(ok(data));
  },
);

// GET /api/v1/progress/insights
progressRoutes.get("/insights", async (c) => {
  const auth = c.get("auth");
  const insights = await progressService.getInsights(auth.profileId);
  return c.json(ok(insights));
});

// GET /api/v1/progress/bests
progressRoutes.get("/bests", async (c) => {
  const auth = c.get("auth");
  const bests = await progressService.getPersonalBests(auth.profileId);
  return c.json(ok(bests));
});

// POST /api/v1/progress/snapshot
progressRoutes.post("/snapshot", async (c) => {
  const auth = c.get("auth");
  const snapshot = await progressService.saveSnapshot(auth.profileId);
  return c.json(ok(snapshot), 201);
});
