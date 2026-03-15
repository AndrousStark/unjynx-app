import { Hono } from "hono";
import { zValidator } from "@hono/zod-validator";
import { authMiddleware } from "../../middleware/auth.js";
import { ok } from "../../types/api.js";
import { pushSchema, pullSchema } from "./sync.schema.js";
import * as syncService from "./sync.service.js";

export const syncRoutes = new Hono();

syncRoutes.use("/*", authMiddleware);

// POST /api/v1/sync/push - Receive local changes from client
syncRoutes.post("/push", zValidator("json", pushSchema), async (c) => {
  const auth = c.get("auth");
  const { records } = c.req.valid("json");
  const acks = await syncService.push(auth.profileId, records);

  return c.json(ok(acks));
});

// POST /api/v1/sync/pull - Get changes since a given timestamp
syncRoutes.post("/pull", zValidator("json", pullSchema), async (c) => {
  const auth = c.get("auth");
  const { since, entityTypes } = c.req.valid("json");
  const records = await syncService.pull(auth.profileId, since, entityTypes);

  return c.json(ok(records));
});

// GET /api/v1/sync/status - Get sync status per entity type
syncRoutes.get("/status", async (c) => {
  const auth = c.get("auth");
  const status = await syncService.getStatus(auth.profileId);

  return c.json(ok(status));
});
