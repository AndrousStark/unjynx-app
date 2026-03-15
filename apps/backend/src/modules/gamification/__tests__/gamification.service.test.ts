import { describe, it, expect, vi, beforeEach } from "vitest";

const mockFindUserXp = vi.fn();
const mockUpsertUserXp = vi.fn();
const mockInsertXpTransaction = vi.fn();
const mockFindAllAchievements = vi.fn();
const mockFindUserAchievements = vi.fn();
const mockGetFriendsLeaderboard = vi.fn();
const mockGetTeamLeaderboard = vi.fn();
const mockInsertChallenge = vi.fn();
const mockFindChallenges = vi.fn();
const mockFindChallengeById = vi.fn();
const mockUpdateChallengeStatus = vi.fn();

vi.mock("../gamification.repository.js", () => ({
  findUserXp: (...args: unknown[]) => mockFindUserXp(...args),
  upsertUserXp: (...args: unknown[]) => mockUpsertUserXp(...args),
  insertXpTransaction: (...args: unknown[]) => mockInsertXpTransaction(...args),
  findAllAchievements: (...args: unknown[]) => mockFindAllAchievements(...args),
  findUserAchievements: (...args: unknown[]) => mockFindUserAchievements(...args),
  getFriendsLeaderboard: (...args: unknown[]) => mockGetFriendsLeaderboard(...args),
  getTeamLeaderboard: (...args: unknown[]) => mockGetTeamLeaderboard(...args),
  insertChallenge: (...args: unknown[]) => mockInsertChallenge(...args),
  findChallenges: (...args: unknown[]) => mockFindChallenges(...args),
  findChallengeById: (...args: unknown[]) => mockFindChallengeById(...args),
  updateChallengeStatus: (...args: unknown[]) => mockUpdateChallengeStatus(...args),
}));

import {
  getXpStatus,
  awardXp,
  getAchievements,
  getLeaderboard,
  createChallenge,
  getChallenges,
  acceptChallenge,
} from "../gamification.service.js";

describe("Gamification Service", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  // ── getXpStatus ─────────────────────────────────────────────────

  describe("getXpStatus", () => {
    it("returns zero status for new user", async () => {
      mockFindUserXp.mockResolvedValueOnce(undefined);

      const result = await getXpStatus("user-1");

      expect(result.totalXp).toBe(0);
      expect(result.level).toBe(1);
      expect(result.currentLevelXp).toBe(0);
      expect(result.xpToNextLevel).toBe(500);
      expect(result.progress).toBe(0);
    });

    it("calculates level and progress correctly", async () => {
      mockFindUserXp.mockResolvedValueOnce({
        userId: "user-1",
        totalXp: 1250,
        level: 3,
      });

      const result = await getXpStatus("user-1");

      expect(result.totalXp).toBe(1250);
      expect(result.level).toBe(3);
      expect(result.currentLevelXp).toBe(250);
      expect(result.xpToNextLevel).toBe(250);
      expect(result.progress).toBe(0.5);
    });

    it("calculates exactly at level boundary", async () => {
      mockFindUserXp.mockResolvedValueOnce({
        userId: "user-1",
        totalXp: 1000,
        level: 3,
      });

      const result = await getXpStatus("user-1");

      expect(result.currentLevelXp).toBe(0);
      expect(result.xpToNextLevel).toBe(500);
    });
  });

  // ── awardXp ─────────────────────────────────────────────────────

  describe("awardXp", () => {
    it("records transaction and updates XP", async () => {
      mockInsertXpTransaction.mockResolvedValueOnce({ id: "tx-1" });
      mockUpsertUserXp.mockResolvedValueOnce({ totalXp: 5, level: 1 });
      mockFindUserXp.mockResolvedValueOnce({ totalXp: 5, level: 1 });

      const result = await awardXp("user-1", {
        source: "task_complete",
        amount: 5,
      });

      expect(mockInsertXpTransaction).toHaveBeenCalledWith(
        expect.objectContaining({
          userId: "user-1",
          amount: 5,
          source: "task_complete",
        }),
      );
      expect(mockUpsertUserXp).toHaveBeenCalledWith("user-1", 5);
      expect(result.totalXp).toBe(5);
    });
  });

  // ── getAchievements ─────────────────────────────────────────────

  describe("getAchievements", () => {
    it("returns achievements with unlock status", async () => {
      const achievement1 = { id: "ach-1", key: "tasks_10", name: "Getting Started" };
      const achievement2 = { id: "ach-2", key: "streak_7", name: "Week Warrior" };
      mockFindAllAchievements.mockResolvedValueOnce([achievement1, achievement2]);
      mockFindUserAchievements.mockResolvedValueOnce([
        { achievementId: "ach-1", unlockedAt: new Date() },
      ]);

      const result = await getAchievements("user-1");

      expect(result).toHaveLength(2);
      expect(result[0].unlocked).toBe(true);
      expect(result[0].unlockedAt).toBeTruthy();
      expect(result[1].unlocked).toBe(false);
      expect(result[1].unlockedAt).toBeNull();
    });

    it("returns empty for no achievements", async () => {
      mockFindAllAchievements.mockResolvedValueOnce([]);
      mockFindUserAchievements.mockResolvedValueOnce([]);

      const result = await getAchievements("user-1");
      expect(result).toHaveLength(0);
    });
  });

  // ── getLeaderboard ──────────────────────────────────────────────

  describe("getLeaderboard", () => {
    it("uses friends leaderboard by default", async () => {
      mockGetFriendsLeaderboard.mockResolvedValueOnce([
        { userId: "user-1", totalXp: 100, level: 1 },
      ]);

      const result = await getLeaderboard("user-1", {
        scope: "friends",
        period: "week",
        limit: 20,
      });

      expect(result).toHaveLength(1);
      expect(mockGetFriendsLeaderboard).toHaveBeenCalled();
    });

    it("uses team leaderboard when scope is team", async () => {
      mockGetTeamLeaderboard.mockResolvedValueOnce([]);

      await getLeaderboard("user-1", {
        scope: "team",
        period: "month",
        limit: 10,
      });

      expect(mockGetTeamLeaderboard).toHaveBeenCalled();
    });
  });

  // ── createChallenge ─────────────────────────────────────────────

  describe("createChallenge", () => {
    it("creates a challenge", async () => {
      const challenge = { id: "ch-1", status: "pending" };
      mockInsertChallenge.mockResolvedValueOnce(challenge);

      const startsAt = new Date("2026-04-01");
      const endsAt = new Date("2026-04-07");

      const result = await createChallenge("user-1", {
        opponentId: "user-2",
        type: "task_count",
        targetValue: 10,
        startsAt,
        endsAt,
      });

      expect(result.id).toBe("ch-1");
      expect(mockInsertChallenge).toHaveBeenCalledWith(
        expect.objectContaining({
          creatorId: "user-1",
          opponentId: "user-2",
          status: "pending",
        }),
      );
    });

    it("rejects self-challenge", async () => {
      await expect(
        createChallenge("user-1", {
          opponentId: "user-1",
          type: "task_count",
          targetValue: 10,
          startsAt: new Date(),
          endsAt: new Date(Date.now() + 86400000),
        }),
      ).rejects.toThrow("Cannot challenge yourself");
    });

    it("rejects end date before start date", async () => {
      await expect(
        createChallenge("user-1", {
          opponentId: "user-2",
          type: "task_count",
          targetValue: 10,
          startsAt: new Date("2026-04-07"),
          endsAt: new Date("2026-04-01"),
        }),
      ).rejects.toThrow("End date must be after start date");
    });
  });

  // ── getChallenges ───────────────────────────────────────────────

  describe("getChallenges", () => {
    it("returns user challenges", async () => {
      mockFindChallenges.mockResolvedValueOnce([{ id: "ch-1" }]);

      const result = await getChallenges("user-1", "active", 20);

      expect(result).toHaveLength(1);
      expect(mockFindChallenges).toHaveBeenCalledWith("user-1", "active", 20);
    });
  });

  // ── acceptChallenge ─────────────────────────────────────────────

  describe("acceptChallenge", () => {
    it("accepts a pending challenge", async () => {
      mockFindChallengeById.mockResolvedValueOnce({
        id: "ch-1",
        opponentId: "user-2",
        status: "pending",
      });
      mockUpdateChallengeStatus.mockResolvedValueOnce({
        id: "ch-1",
        status: "active",
      });

      const result = await acceptChallenge("user-2", "ch-1");

      expect(result?.status).toBe("active");
    });

    it("returns undefined for non-existent challenge", async () => {
      mockFindChallengeById.mockResolvedValueOnce(undefined);

      const result = await acceptChallenge("user-2", "ch-999");
      expect(result).toBeUndefined();
    });

    it("rejects if user is not the opponent", async () => {
      mockFindChallengeById.mockResolvedValueOnce({
        id: "ch-1",
        opponentId: "user-3",
        status: "pending",
      });

      await expect(acceptChallenge("user-2", "ch-1")).rejects.toThrow(
        "Only the opponent can accept this challenge",
      );
    });

    it("rejects if challenge is not pending", async () => {
      mockFindChallengeById.mockResolvedValueOnce({
        id: "ch-1",
        opponentId: "user-2",
        status: "active",
      });

      await expect(acceptChallenge("user-2", "ch-1")).rejects.toThrow(
        "Challenge is not in pending status",
      );
    });
  });
});
