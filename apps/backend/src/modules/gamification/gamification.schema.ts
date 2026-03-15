import { z } from "zod";

export const awardXpSchema = z.object({
  source: z.enum([
    "task_complete",
    "task_last_minute",
    "ritual_complete",
    "ghost_mode",
    "pomodoro",
    "streak_milestone",
    "achievement",
  ]),
  amount: z.number().int().positive().max(10000),
  sourceId: z.string().uuid().optional(),
  description: z.string().max(500).optional(),
});

export const leaderboardQuerySchema = z.object({
  scope: z.enum(["friends", "team"]).default("friends"),
  period: z.enum(["week", "month"]).default("week"),
  limit: z.coerce.number().int().min(1).max(100).default(20),
});

export const createChallengeSchema = z.object({
  opponentId: z.string().uuid(),
  type: z.enum(["task_count", "streak", "focus_time"]),
  targetValue: z.number().int().positive(),
  startsAt: z.coerce.date(),
  endsAt: z.coerce.date(),
});

export const challengeQuerySchema = z.object({
  status: z.enum(["pending", "active", "completed", "expired"]).optional(),
  limit: z.coerce.number().int().min(1).max(50).default(20),
});

export type AwardXpInput = z.infer<typeof awardXpSchema>;
export type LeaderboardQuery = z.infer<typeof leaderboardQuerySchema>;
export type CreateChallengeInput = z.infer<typeof createChallengeSchema>;
export type ChallengeQuery = z.infer<typeof challengeQuerySchema>;
