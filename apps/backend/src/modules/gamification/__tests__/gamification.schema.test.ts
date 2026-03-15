import { describe, it, expect } from "vitest";
import {
  awardXpSchema,
  leaderboardQuerySchema,
  createChallengeSchema,
  challengeQuerySchema,
} from "../gamification.schema.js";

describe("Gamification Schemas", () => {
  describe("awardXpSchema", () => {
    it("validates valid XP award", () => {
      const result = awardXpSchema.safeParse({
        source: "task_complete",
        amount: 5,
      });
      expect(result.success).toBe(true);
    });

    it("accepts all valid sources", () => {
      const sources = [
        "task_complete",
        "task_last_minute",
        "ritual_complete",
        "ghost_mode",
        "pomodoro",
        "streak_milestone",
        "achievement",
      ];
      for (const source of sources) {
        const result = awardXpSchema.safeParse({ source, amount: 10 });
        expect(result.success).toBe(true);
      }
    });

    it("rejects invalid source", () => {
      const result = awardXpSchema.safeParse({
        source: "invalid",
        amount: 5,
      });
      expect(result.success).toBe(false);
    });

    it("rejects zero amount", () => {
      const result = awardXpSchema.safeParse({
        source: "task_complete",
        amount: 0,
      });
      expect(result.success).toBe(false);
    });

    it("rejects negative amount", () => {
      const result = awardXpSchema.safeParse({
        source: "task_complete",
        amount: -5,
      });
      expect(result.success).toBe(false);
    });

    it("rejects amount > 10000", () => {
      const result = awardXpSchema.safeParse({
        source: "task_complete",
        amount: 10001,
      });
      expect(result.success).toBe(false);
    });

    it("accepts optional sourceId and description", () => {
      const result = awardXpSchema.safeParse({
        source: "task_complete",
        amount: 5,
        sourceId: "123e4567-e89b-12d3-a456-426614174000",
        description: "Completed daily task",
      });
      expect(result.success).toBe(true);
    });
  });

  describe("leaderboardQuerySchema", () => {
    it("uses defaults", () => {
      const result = leaderboardQuerySchema.parse({});
      expect(result.scope).toBe("friends");
      expect(result.period).toBe("week");
      expect(result.limit).toBe(20);
    });

    it("accepts team scope and month period", () => {
      const result = leaderboardQuerySchema.parse({
        scope: "team",
        period: "month",
      });
      expect(result.scope).toBe("team");
      expect(result.period).toBe("month");
    });

    it("rejects invalid scope", () => {
      const result = leaderboardQuerySchema.safeParse({ scope: "global" });
      expect(result.success).toBe(false);
    });
  });

  describe("createChallengeSchema", () => {
    it("validates valid challenge", () => {
      const result = createChallengeSchema.safeParse({
        opponentId: "123e4567-e89b-12d3-a456-426614174000",
        type: "task_count",
        targetValue: 10,
        startsAt: "2026-04-01",
        endsAt: "2026-04-07",
      });
      expect(result.success).toBe(true);
    });

    it("accepts all challenge types", () => {
      for (const type of ["task_count", "streak", "focus_time"]) {
        const result = createChallengeSchema.safeParse({
          opponentId: "123e4567-e89b-12d3-a456-426614174000",
          type,
          targetValue: 5,
          startsAt: "2026-04-01",
          endsAt: "2026-04-07",
        });
        expect(result.success).toBe(true);
      }
    });

    it("rejects non-positive targetValue", () => {
      const result = createChallengeSchema.safeParse({
        opponentId: "123e4567-e89b-12d3-a456-426614174000",
        type: "task_count",
        targetValue: 0,
        startsAt: "2026-04-01",
        endsAt: "2026-04-07",
      });
      expect(result.success).toBe(false);
    });

    it("rejects invalid opponentId format", () => {
      const result = createChallengeSchema.safeParse({
        opponentId: "not-a-uuid",
        type: "task_count",
        targetValue: 10,
        startsAt: "2026-04-01",
        endsAt: "2026-04-07",
      });
      expect(result.success).toBe(false);
    });
  });

  describe("challengeQuerySchema", () => {
    it("uses defaults", () => {
      const result = challengeQuerySchema.parse({});
      expect(result.limit).toBe(20);
      expect(result.status).toBeUndefined();
    });

    it("accepts valid status filter", () => {
      for (const status of ["pending", "active", "completed", "expired"]) {
        const result = challengeQuerySchema.safeParse({ status });
        expect(result.success).toBe(true);
      }
    });
  });
});
