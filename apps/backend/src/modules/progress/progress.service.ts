import type { HeatmapQuery, CompletionTrendQuery } from "./progress.schema.js";
import type { ProgressSnapshot, Streak } from "../../db/schema/index.js";
import * as progressRepo from "./progress.repository.js";

// ── Rings (Today's Progress) ─────────────────────────────────────────

export async function getRings(userId: string): Promise<{
  readonly tasksCompleted: number;
  readonly tasksCreated: number;
  readonly focusMinutes: number;
  readonly completionRate: number;
}> {
  return progressRepo.calculateDailyProgress(userId, new Date());
}

// ── Streak ───────────────────────────────────────────────────────────

export async function getStreak(userId: string): Promise<{
  readonly currentStreak: number;
  readonly longestStreak: number;
  readonly lastActiveDate: Date | null;
  readonly isFrozen: boolean;
}> {
  const streak = await progressRepo.findStreakByUserId(userId);

  if (!streak) {
    return {
      currentStreak: 0,
      longestStreak: 0,
      lastActiveDate: null,
      isFrozen: false,
    };
  }

  return {
    currentStreak: streak.currentStreak,
    longestStreak: streak.longestStreak,
    lastActiveDate: streak.lastActiveDate,
    isFrozen: streak.isFrozen,
  };
}

// ── Heatmap ──────────────────────────────────────────────────────────

export async function getHeatmap(
  userId: string,
  query: HeatmapQuery,
): Promise<ProgressSnapshot[]> {
  const endDate = query.endDate ?? new Date();
  const startDate =
    query.startDate ?? new Date(endDate.getTime() - 30 * 86_400_000);

  return progressRepo.findProgressSnapshots(userId, startDate, endDate);
}

// ── Weekly Insights ──────────────────────────────────────────────────

export async function getInsights(userId: string): Promise<{
  readonly totalTasksCompleted: number;
  readonly totalTasksCreated: number;
  readonly totalFocusMinutes: number;
  readonly averageCompletionRate: number;
  readonly bestDay: string | null;
  readonly activeDays: number;
}> {
  const endDate = new Date();
  const startDate = new Date(endDate.getTime() - 7 * 86_400_000);

  const snapshots = await progressRepo.findProgressSnapshots(
    userId,
    startDate,
    endDate,
  );

  if (snapshots.length === 0) {
    return {
      totalTasksCompleted: 0,
      totalTasksCreated: 0,
      totalFocusMinutes: 0,
      averageCompletionRate: 0,
      bestDay: null,
      activeDays: 0,
    };
  }

  const totalTasksCompleted = snapshots.reduce(
    (acc, s) => acc + s.tasksCompleted,
    0,
  );
  const totalTasksCreated = snapshots.reduce(
    (acc, s) => acc + s.tasksCreated,
    0,
  );
  const totalFocusMinutes = snapshots.reduce(
    (acc, s) => acc + s.focusMinutes,
    0,
  );
  const averageCompletionRate =
    snapshots.reduce((acc, s) => acc + s.completionRate, 0) / snapshots.length;

  // Find the best day by tasks completed
  const bestSnapshot = snapshots.reduce((best, s) =>
    s.tasksCompleted > best.tasksCompleted ? s : best,
  );

  const activeDays = snapshots.filter(
    (s) => s.tasksCompleted > 0 || s.focusMinutes > 0,
  ).length;

  return {
    totalTasksCompleted,
    totalTasksCreated,
    totalFocusMinutes,
    averageCompletionRate: Math.round(averageCompletionRate * 100) / 100,
    bestDay: bestSnapshot.snapshotDate.toISOString().split("T")[0],
    activeDays,
  };
}

// ── Completion Trend ────────────────────────────────────────────────

export async function getCompletionTrend(
  userId: string,
  query: CompletionTrendQuery,
): Promise<{
  readonly entries: ReadonlyArray<{ readonly day: string; readonly count: number }>;
}> {
  const entries = await progressRepo.findCompletionTrend(userId, query.days);
  return { entries };
}

// ── Productivity by Day of Week ─────────────────────────────────────

const DAY_NAMES = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"] as const;

export async function getProductivityByDay(userId: string): Promise<{
  readonly entries: ReadonlyArray<{ readonly day: string; readonly count: number }>;
}> {
  const raw = await progressRepo.findProductivityByDay(userId);

  // Fill all 7 days (even if zero) — Mon–Sun order for UI.
  const dayMap = new Map<number, number>();
  for (const row of raw) {
    dayMap.set(row.dow, row.count);
  }

  const entries = [1, 2, 3, 4, 5, 6, 0].map((dow) => ({
    day: DAY_NAMES[dow],
    count: dayMap.get(dow) ?? 0,
  }));

  return { entries };
}

// ── Productivity by Hour Heatmap ────────────────────────────────────

export async function getProductivityByHour(userId: string): Promise<{
  readonly entries: ReadonlyArray<{
    readonly hour: number;
    readonly day: number;
    readonly intensity: number;
  }>;
}> {
  const raw = await progressRepo.findProductivityByHour(userId);

  // Find max count for normalization.
  const maxCount = raw.reduce((max, r) => Math.max(max, r.count), 1);

  const entries = raw.map((r) => ({
    hour: r.hour,
    day: r.dow,
    intensity: Math.round((r.count / maxCount) * 100) / 100,
  }));

  return { entries };
}

// ── Personal Bests ───────────────────────────────────────────────────

export async function getPersonalBests(userId: string): Promise<{
  readonly bestTasksCompleted: number;
  readonly bestFocusMinutes: number;
  readonly bestCompletionRate: number;
  readonly bestStreak: number;
}> {
  return progressRepo.findPersonalBests(userId);
}

// ── Save Snapshot (called by cron or manual trigger) ─────────────────

export async function saveSnapshot(
  userId: string,
): Promise<ProgressSnapshot> {
  const today = new Date();
  const dailyData = await progressRepo.calculateDailyProgress(userId, today);

  return progressRepo.upsertProgressSnapshot(userId, today, dailyData);
}
