import { describe, it, expect, vi, beforeEach } from "vitest";

const mockCalculateDailyProgress = vi.fn();
const mockFindStreakByUserId = vi.fn();
const mockUpdateStreak = vi.fn();
const mockFindProgressSnapshots = vi.fn();
const mockUpsertProgressSnapshot = vi.fn();
const mockFindPersonalBests = vi.fn();

vi.mock("../progress.repository.js", () => ({
  calculateDailyProgress: (...args: unknown[]) =>
    mockCalculateDailyProgress(...args),
  findStreakByUserId: (...args: unknown[]) =>
    mockFindStreakByUserId(...args),
  updateStreak: (...args: unknown[]) => mockUpdateStreak(...args),
  findProgressSnapshots: (...args: unknown[]) =>
    mockFindProgressSnapshots(...args),
  upsertProgressSnapshot: (...args: unknown[]) =>
    mockUpsertProgressSnapshot(...args),
  findPersonalBests: (...args: unknown[]) =>
    mockFindPersonalBests(...args),
}));

vi.mock("../../../env.js", () => ({
  env: {
    NODE_ENV: "test",
    PORT: 3000,
    LOG_LEVEL: "info",
    DATABASE_URL: "postgres://test:test@localhost:5432/test",
    REDIS_URL: "redis://localhost:6379",
    LOGTO_ENDPOINT: "http://localhost:3001",
    LOGTO_APP_ID: "test-app-id",
    LOGTO_APP_SECRET: "test-app-secret",
    S3_ENDPOINT: "http://localhost:9000",
    S3_ACCESS_KEY: "minioadmin",
    S3_SECRET_KEY: "minioadmin",
    S3_BUCKET: "test-bucket",
    S3_REGION: "us-east-1",
  },
}));

import {
  getRings,
  getStreak,
  getHeatmap,
  getInsights,
  getPersonalBests,
  saveSnapshot,
} from "../progress.service.js";

describe("Progress Service", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("getRings", () => {
    it("calls calculateDailyProgress with userId and a Date", async () => {
      const mockData = {
        tasksCompleted: 3,
        tasksCreated: 5,
        focusMinutes: 90,
        completionRate: 0.6,
      };
      mockCalculateDailyProgress.mockResolvedValueOnce(mockData);

      const result = await getRings("user-1");

      expect(result).toEqual(mockData);
      expect(mockCalculateDailyProgress).toHaveBeenCalledWith(
        "user-1",
        expect.any(Date),
      );
    });
  });

  describe("getStreak", () => {
    it("returns streak data when streak exists", async () => {
      const fakeStreak = {
        id: "streak-1",
        userId: "user-1",
        currentStreak: 5,
        longestStreak: 12,
        lastActiveDate: new Date("2026-03-09"),
        isFrozen: false,
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      mockFindStreakByUserId.mockResolvedValueOnce(fakeStreak);

      const result = await getStreak("user-1");

      expect(result).toEqual({
        currentStreak: 5,
        longestStreak: 12,
        lastActiveDate: new Date("2026-03-09"),
        isFrozen: false,
      });
    });

    it("returns zeros when no streak exists", async () => {
      mockFindStreakByUserId.mockResolvedValueOnce(undefined);

      const result = await getStreak("user-1");

      expect(result).toEqual({
        currentStreak: 0,
        longestStreak: 0,
        lastActiveDate: null,
        isFrozen: false,
      });
    });
  });

  describe("getHeatmap", () => {
    it("defaults to last 30 days when no dates provided", async () => {
      mockFindProgressSnapshots.mockResolvedValueOnce([]);

      await getHeatmap("user-1", {});

      expect(mockFindProgressSnapshots).toHaveBeenCalledWith(
        "user-1",
        expect.any(Date),
        expect.any(Date),
      );

      const [, startDate, endDate] =
        mockFindProgressSnapshots.mock.calls[0] as [string, Date, Date];
      const diffMs = endDate.getTime() - startDate.getTime();
      const diffDays = Math.round(diffMs / 86_400_000);
      expect(diffDays).toBe(30);
    });

    it("passes provided dates to repository", async () => {
      const start = new Date("2026-02-01");
      const end = new Date("2026-03-01");
      mockFindProgressSnapshots.mockResolvedValueOnce([]);

      await getHeatmap("user-1", { startDate: start, endDate: end });

      expect(mockFindProgressSnapshots).toHaveBeenCalledWith(
        "user-1",
        start,
        end,
      );
    });
  });

  describe("getInsights", () => {
    it("returns zeros for empty snapshots", async () => {
      mockFindProgressSnapshots.mockResolvedValueOnce([]);

      const result = await getInsights("user-1");

      expect(result).toEqual({
        totalTasksCompleted: 0,
        totalTasksCreated: 0,
        totalFocusMinutes: 0,
        averageCompletionRate: 0,
        bestDay: null,
        activeDays: 0,
      });
    });

    it("calculates correct aggregates for multiple snapshots", async () => {
      const mockSnapshots = [
        {
          snapshotDate: new Date("2026-03-07"),
          tasksCompleted: 5,
          tasksCreated: 8,
          focusMinutes: 120,
          completionRate: 0.625,
        },
        {
          snapshotDate: new Date("2026-03-08"),
          tasksCompleted: 3,
          tasksCreated: 4,
          focusMinutes: 60,
          completionRate: 0.75,
        },
        {
          snapshotDate: new Date("2026-03-09"),
          tasksCompleted: 0,
          tasksCreated: 2,
          focusMinutes: 0,
          completionRate: 0,
        },
      ];
      mockFindProgressSnapshots.mockResolvedValueOnce(mockSnapshots);

      const result = await getInsights("user-1");

      expect(result.totalTasksCompleted).toBe(8); // 5 + 3 + 0
      expect(result.totalTasksCreated).toBe(14); // 8 + 4 + 2
      expect(result.totalFocusMinutes).toBe(180); // 120 + 60 + 0
      expect(result.bestDay).toBe("2026-03-07"); // highest tasksCompleted = 5
      expect(result.activeDays).toBe(2); // days with tasksCompleted > 0 or focusMinutes > 0
      // averageCompletionRate = (0.625 + 0.75 + 0) / 3 = 0.458333... rounded to 0.46
      expect(result.averageCompletionRate).toBe(0.46);
    });
  });

  describe("getPersonalBests", () => {
    it("passes through from repository", async () => {
      const mockBests = {
        bestTasksCompleted: 10,
        bestFocusMinutes: 240,
        bestCompletionRate: 1.0,
        bestStreak: 15,
      };
      mockFindPersonalBests.mockResolvedValueOnce(mockBests);

      const result = await getPersonalBests("user-1");

      expect(result).toEqual(mockBests);
      expect(mockFindPersonalBests).toHaveBeenCalledWith("user-1");
    });
  });

  describe("saveSnapshot", () => {
    it("calls calculateDailyProgress then upsertProgressSnapshot", async () => {
      const dailyData = {
        tasksCompleted: 4,
        tasksCreated: 6,
        focusMinutes: 90,
        completionRate: 0.67,
      };
      const fakeSnapshot = {
        id: "snap-1",
        userId: "user-1",
        snapshotDate: new Date(),
        ...dailyData,
        createdAt: new Date(),
      };
      mockCalculateDailyProgress.mockResolvedValueOnce(dailyData);
      mockUpsertProgressSnapshot.mockResolvedValueOnce(fakeSnapshot);

      const result = await saveSnapshot("user-1");

      expect(result).toEqual(fakeSnapshot);
      expect(mockCalculateDailyProgress).toHaveBeenCalledWith(
        "user-1",
        expect.any(Date),
      );
      expect(mockUpsertProgressSnapshot).toHaveBeenCalledWith(
        "user-1",
        expect.any(Date),
        dailyData,
      );
    });
  });
});
