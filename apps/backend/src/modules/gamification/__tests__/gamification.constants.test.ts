import { describe, it, expect } from "vitest";
import {
  XP_REWARDS,
  XP_PER_LEVEL,
  ACHIEVEMENT_DEFS,
} from "../gamification.constants.js";

describe("Gamification Constants", () => {
  describe("XP_REWARDS", () => {
    it("has all expected reward keys", () => {
      expect(XP_REWARDS.TASK_COMPLETE).toBe(5);
      expect(XP_REWARDS.LAST_TASK_OF_DAY).toBe(20);
      expect(XP_REWARDS.MORNING_RITUAL).toBe(25);
      expect(XP_REWARDS.GHOST_MODE_SESSION).toBe(15);
      expect(XP_REWARDS.POMODORO_COMPLETE).toBe(10);
      expect(XP_REWARDS.STREAK_7).toBe(50);
      expect(XP_REWARDS.STREAK_30).toBe(100);
      expect(XP_REWARDS.STREAK_100).toBe(500);
      expect(XP_REWARDS.STREAK_365).toBe(1000);
    });

    it("all values are positive integers", () => {
      for (const [, value] of Object.entries(XP_REWARDS)) {
        expect(value).toBeGreaterThan(0);
        expect(Number.isInteger(value)).toBe(true);
      }
    });
  });

  describe("XP_PER_LEVEL", () => {
    it("is 500", () => {
      expect(XP_PER_LEVEL).toBe(500);
    });
  });

  describe("ACHIEVEMENT_DEFS", () => {
    it("has 31 predefined achievements", () => {
      expect(ACHIEVEMENT_DEFS.length).toBe(31);
    });

    it("all achievements have unique keys", () => {
      const keys = ACHIEVEMENT_DEFS.map((a) => a.key);
      const uniqueKeys = new Set(keys);
      expect(uniqueKeys.size).toBe(keys.length);
    });

    it("all achievements have valid categories", () => {
      const validCategories = ["consistency", "volume", "exploration", "special"];
      for (const achievement of ACHIEVEMENT_DEFS) {
        expect(validCategories).toContain(achievement.category);
      }
    });

    it("all achievements have positive xpReward", () => {
      for (const achievement of ACHIEVEMENT_DEFS) {
        expect(achievement.xpReward).toBeGreaterThan(0);
      }
    });

    it("all achievements have positive requiredValue", () => {
      for (const achievement of ACHIEVEMENT_DEFS) {
        expect(achievement.requiredValue).toBeGreaterThan(0);
      }
    });

    it("includes streak achievements", () => {
      const streakAchievements = ACHIEVEMENT_DEFS.filter((a) =>
        a.key.startsWith("streak_"),
      );
      expect(streakAchievements.length).toBeGreaterThanOrEqual(4);
    });

    it("includes task volume achievements", () => {
      const taskAchievements = ACHIEVEMENT_DEFS.filter((a) =>
        a.key.startsWith("tasks_"),
      );
      expect(taskAchievements.length).toBeGreaterThanOrEqual(5);
    });
  });
});
