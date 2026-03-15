import { Hono } from "hono";
import { zValidator } from "@hono/zod-validator";
import { authMiddleware } from "../../middleware/auth.js";
import { ok, err } from "../../types/api.js";
import {
  sendNudgeSchema,
  createSharedGoalSchema,
} from "./accountability.schema.js";
import * as accountabilityService from "./accountability.service.js";

export const accountabilityRoutes = new Hono();

accountabilityRoutes.use("/*", authMiddleware);

// GET /partners - List partners
accountabilityRoutes.get("/partners", async (c) => {
  const auth = c.get("auth");
  const partners = await accountabilityService.getPartners(auth.profileId);
  return c.json(ok(partners));
});

// POST /invite - Create invite (generates code + link)
accountabilityRoutes.post("/invite", async (c) => {
  const auth = c.get("auth");
  const result = await accountabilityService.createInvite(auth.profileId);
  return c.json(ok(result), 201);
});

// POST /accept/:code - Accept invite
accountabilityRoutes.post("/accept/:code", async (c) => {
  const auth = c.get("auth");
  const code = c.req.param("code");

  try {
    const partner = await accountabilityService.acceptInvite(
      auth.profileId,
      code,
    );

    if (!partner) {
      return c.json(err("Invite not found"), 404);
    }

    return c.json(ok(partner));
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to accept invite";
    return c.json(err(message), 400);
  }
});

// DELETE /partners/:id - Remove partner
accountabilityRoutes.delete("/partners/:id", async (c) => {
  const auth = c.get("auth");
  const partnerId = c.req.param("id");
  const deleted = await accountabilityService.removePartner(
    auth.profileId,
    partnerId,
  );

  if (!deleted) {
    return c.json(err("Partnership not found"), 404);
  }

  return c.json(ok({ deleted: true }));
});

// POST /nudge/:partnerId - Send nudge (max 1/day)
accountabilityRoutes.post(
  "/nudge/:partnerId",
  zValidator("json", sendNudgeSchema),
  async (c) => {
    const auth = c.get("auth");
    const partnerId = c.req.param("partnerId");
    const input = c.req.valid("json");

    try {
      const nudge = await accountabilityService.sendNudge(
        auth.profileId,
        partnerId,
        input,
      );
      return c.json(ok(nudge), 201);
    } catch (error) {
      const message = error instanceof Error ? error.message : "Failed to send nudge";
      return c.json(err(message), 400);
    }
  },
);

// POST /goals - Create shared goal
accountabilityRoutes.post(
  "/goals",
  zValidator("json", createSharedGoalSchema),
  async (c) => {
    const input = c.req.valid("json");

    try {
      const goal = await accountabilityService.createSharedGoal(input);
      return c.json(ok(goal), 201);
    } catch (error) {
      const message = error instanceof Error ? error.message : "Failed to create goal";
      return c.json(err(message), 400);
    }
  },
);

// GET /goals/:id/progress - Goal progress
accountabilityRoutes.get("/goals/:id/progress", async (c) => {
  const goalId = c.req.param("id");
  const result = await accountabilityService.getGoalProgress(goalId);

  if (!result) {
    return c.json(err("Goal not found"), 404);
  }

  return c.json(ok(result));
});
