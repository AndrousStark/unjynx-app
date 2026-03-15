import { Hono } from "hono";
import { zValidator } from "@hono/zod-validator";
import { authMiddleware } from "../../middleware/auth.js";
import { ok, err } from "../../types/api.js";
import {
  awardXpSchema,
  leaderboardQuerySchema,
  createChallengeSchema,
  challengeQuerySchema,
} from "./gamification.schema.js";
import * as gamificationService from "./gamification.service.js";

export const gamificationRoutes = new Hono();

gamificationRoutes.use("/*", authMiddleware);

// GET /xp - User XP + level + next level progress
gamificationRoutes.get("/xp", async (c) => {
  const auth = c.get("auth");
  const status = await gamificationService.getXpStatus(auth.profileId);
  return c.json(ok(status));
});

// POST /xp/award - Award XP (internal, called by task/ritual completion hooks)
gamificationRoutes.post(
  "/xp/award",
  zValidator("json", awardXpSchema),
  async (c) => {
    const auth = c.get("auth");
    const input = c.req.valid("json");

    try {
      const status = await gamificationService.awardXp(auth.profileId, input);
      return c.json(ok(status), 201);
    } catch (error) {
      const message = error instanceof Error ? error.message : "Failed to award XP";
      return c.json(err(message), 500);
    }
  },
);

// GET /achievements - All achievements with unlock status
gamificationRoutes.get("/achievements", async (c) => {
  const auth = c.get("auth");
  const achievements = await gamificationService.getAchievements(auth.profileId);
  return c.json(ok(achievements));
});

// GET /leaderboard - Leaderboard
gamificationRoutes.get(
  "/leaderboard",
  zValidator("query", leaderboardQuerySchema),
  async (c) => {
    const auth = c.get("auth");
    const query = c.req.valid("query");
    const entries = await gamificationService.getLeaderboard(
      auth.profileId,
      query,
    );
    return c.json(ok(entries));
  },
);

// POST /challenges - Create challenge
gamificationRoutes.post(
  "/challenges",
  zValidator("json", createChallengeSchema),
  async (c) => {
    const auth = c.get("auth");
    const input = c.req.valid("json");

    try {
      const challenge = await gamificationService.createChallenge(
        auth.profileId,
        input,
      );
      return c.json(ok(challenge), 201);
    } catch (error) {
      const message = error instanceof Error ? error.message : "Failed to create challenge";
      return c.json(err(message), 400);
    }
  },
);

// GET /challenges - Active/recent challenges
gamificationRoutes.get(
  "/challenges",
  zValidator("query", challengeQuerySchema),
  async (c) => {
    const auth = c.get("auth");
    const query = c.req.valid("query");
    const challenges = await gamificationService.getChallenges(
      auth.profileId,
      query.status,
      query.limit,
    );
    return c.json(ok(challenges));
  },
);

// PATCH /challenges/:id/accept - Accept challenge
gamificationRoutes.patch("/challenges/:id/accept", async (c) => {
  const auth = c.get("auth");
  const challengeId = c.req.param("id");

  try {
    const challenge = await gamificationService.acceptChallenge(
      auth.profileId,
      challengeId,
    );

    if (!challenge) {
      return c.json(err("Challenge not found"), 404);
    }

    return c.json(ok(challenge));
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to accept challenge";
    return c.json(err(message), 400);
  }
});
