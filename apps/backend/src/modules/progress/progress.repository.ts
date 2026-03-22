import {
  eq,
  and,
  gte,
  lte,
  count,
  sum,
  max,
  desc,
  sql,
} from "drizzle-orm";
import { db } from "../../db/index.js";
import {
  streaks,
  progressSnapshots,
  tasks,
  pomodoroSessions,
  type Streak,
  type ProgressSnapshot,
} from "../../db/schema/index.js";

// ── Streaks ──────────────────────────────────────────────────────────

export async function findStreakByUserId(
  userId: string,
): Promise<Streak | undefined> {
  const [streak] = await db
    .select()
    .from(streaks)
    .where(eq(streaks.userId, userId));

  return streak;
}

export async function updateStreak(
  userId: string,
  data: Partial<{
    currentStreak: number;
    longestStreak: number;
    lastActiveDate: Date;
    isFrozen: boolean;
  }>,
): Promise<Streak> {
  const existing = await findStreakByUserId(userId);

  if (existing) {
    const [updated] = await db
      .update(streaks)
      .set({ ...data, updatedAt: new Date() })
      .where(eq(streaks.userId, userId))
      .returning();
    return updated;
  }

  const [created] = await db
    .insert(streaks)
    .values({
      userId,
      currentStreak: data.currentStreak ?? 0,
      longestStreak: data.longestStreak ?? 0,
      lastActiveDate: data.lastActiveDate,
      isFrozen: data.isFrozen ?? false,
    })
    .returning();

  return created;
}

// ── Progress Snapshots ───────────────────────────────────────────────

export async function findProgressSnapshots(
  userId: string,
  startDate: Date,
  endDate: Date,
): Promise<ProgressSnapshot[]> {
  return db
    .select()
    .from(progressSnapshots)
    .where(
      and(
        eq(progressSnapshots.userId, userId),
        gte(progressSnapshots.snapshotDate, startDate),
        lte(progressSnapshots.snapshotDate, endDate),
      ),
    )
    .orderBy(progressSnapshots.snapshotDate);
}

export async function upsertProgressSnapshot(
  userId: string,
  date: Date,
  data: {
    readonly tasksCompleted: number;
    readonly tasksCreated: number;
    readonly focusMinutes: number;
    readonly completionRate: number;
  },
): Promise<ProgressSnapshot> {
  const dayStart = new Date(date);
  dayStart.setHours(0, 0, 0, 0);

  const dayEnd = new Date(date);
  dayEnd.setHours(23, 59, 59, 999);

  // Check if a snapshot already exists for this date
  const [existing] = await db
    .select()
    .from(progressSnapshots)
    .where(
      and(
        eq(progressSnapshots.userId, userId),
        gte(progressSnapshots.snapshotDate, dayStart),
        lte(progressSnapshots.snapshotDate, dayEnd),
      ),
    );

  if (existing) {
    const [updated] = await db
      .update(progressSnapshots)
      .set({
        tasksCompleted: data.tasksCompleted,
        tasksCreated: data.tasksCreated,
        focusMinutes: data.focusMinutes,
        completionRate: data.completionRate,
      })
      .where(eq(progressSnapshots.id, existing.id))
      .returning();
    return updated;
  }

  const [created] = await db
    .insert(progressSnapshots)
    .values({
      userId,
      snapshotDate: dayStart,
      tasksCompleted: data.tasksCompleted,
      tasksCreated: data.tasksCreated,
      focusMinutes: data.focusMinutes,
      completionRate: data.completionRate,
    })
    .returning();

  return created;
}

// ── Daily Calculations (from tasks + pomodoro tables) ────────────────

export async function calculateDailyProgress(
  userId: string,
  date: Date,
): Promise<{
  readonly tasksCompleted: number;
  readonly tasksCreated: number;
  readonly focusMinutes: number;
  readonly completionRate: number;
}> {
  const dayStart = new Date(date);
  dayStart.setHours(0, 0, 0, 0);

  const dayEnd = new Date(date);
  dayEnd.setHours(23, 59, 59, 999);

  // Count tasks completed today
  const [{ completedCount }] = await db
    .select({ completedCount: count() })
    .from(tasks)
    .where(
      and(
        eq(tasks.userId, userId),
        eq(tasks.status, "completed"),
        gte(tasks.completedAt, dayStart),
        lte(tasks.completedAt, dayEnd),
      ),
    );

  // Count tasks created today
  const [{ createdCount }] = await db
    .select({ createdCount: count() })
    .from(tasks)
    .where(
      and(
        eq(tasks.userId, userId),
        gte(tasks.createdAt, dayStart),
        lte(tasks.createdAt, dayEnd),
      ),
    );

  // Sum focus minutes from pomodoro sessions today
  const [focusResult] = await db
    .select({
      totalMinutes: sum(pomodoroSessions.durationMinutes),
    })
    .from(pomodoroSessions)
    .where(
      and(
        eq(pomodoroSessions.userId, userId),
        gte(pomodoroSessions.startedAt, dayStart),
        lte(pomodoroSessions.startedAt, dayEnd),
      ),
    );

  const focusMinutes = Number(focusResult.totalMinutes) || 0;

  // Completion rate: completed / (completed + pending for today)
  const [{ totalTasks }] = await db
    .select({ totalTasks: count() })
    .from(tasks)
    .where(
      and(
        eq(tasks.userId, userId),
        gte(tasks.createdAt, dayStart),
        lte(tasks.createdAt, dayEnd),
      ),
    );

  const completionRate =
    totalTasks > 0 ? Math.round((completedCount / totalTasks) * 100) / 100 : 0;

  return {
    tasksCompleted: completedCount,
    tasksCreated: createdCount,
    focusMinutes,
    completionRate,
  };
}

// ── Completion Trend (daily counts) ─────────────────────────────────

export async function findCompletionTrend(
  userId: string,
  days: number,
): Promise<Array<{ day: string; count: number }>> {
  const startDate = new Date(Date.now() - days * 86_400_000);

  const rows = await db
    .select({
      day: sql<string>`date_trunc('day', ${tasks.completedAt})::date::text`,
      count: count(),
    })
    .from(tasks)
    .where(
      and(
        eq(tasks.userId, userId),
        eq(tasks.status, "completed"),
        gte(tasks.completedAt, startDate),
      ),
    )
    .groupBy(sql`date_trunc('day', ${tasks.completedAt})`)
    .orderBy(sql`date_trunc('day', ${tasks.completedAt})`);

  return rows.map((r) => ({ day: r.day, count: r.count }));
}

// ── Productivity by Day of Week ─────────────────────────────────────

export async function findProductivityByDay(
  userId: string,
): Promise<Array<{ dow: number; count: number }>> {
  const rows = await db
    .select({
      dow: sql<number>`extract(dow from ${tasks.completedAt})::int`,
      count: count(),
    })
    .from(tasks)
    .where(
      and(
        eq(tasks.userId, userId),
        eq(tasks.status, "completed"),
        sql`${tasks.completedAt} IS NOT NULL`,
      ),
    )
    .groupBy(sql`extract(dow from ${tasks.completedAt})`);

  return rows.map((r) => ({ dow: r.dow, count: r.count }));
}

// ── Productivity by Hour Heatmap ────────────────────────────────────

export async function findProductivityByHour(
  userId: string,
): Promise<Array<{ hour: number; dow: number; count: number }>> {
  const rows = await db
    .select({
      hour: sql<number>`extract(hour from ${tasks.completedAt})::int`,
      dow: sql<number>`extract(dow from ${tasks.completedAt})::int`,
      count: count(),
    })
    .from(tasks)
    .where(
      and(
        eq(tasks.userId, userId),
        eq(tasks.status, "completed"),
        sql`${tasks.completedAt} IS NOT NULL`,
      ),
    )
    .groupBy(
      sql`extract(hour from ${tasks.completedAt})`,
      sql`extract(dow from ${tasks.completedAt})`,
    );

  return rows.map((r) => ({ hour: r.hour, dow: r.dow, count: r.count }));
}

// ── Personal Bests ───────────────────────────────────────────────────

export async function findPersonalBests(userId: string): Promise<{
  readonly bestTasksCompleted: number;
  readonly bestFocusMinutes: number;
  readonly bestCompletionRate: number;
  readonly bestStreak: number;
}> {
  const [snapshotBests] = await db
    .select({
      bestTasksCompleted: max(progressSnapshots.tasksCompleted),
      bestFocusMinutes: max(progressSnapshots.focusMinutes),
      bestCompletionRate: max(progressSnapshots.completionRate),
    })
    .from(progressSnapshots)
    .where(eq(progressSnapshots.userId, userId));

  const streak = await findStreakByUserId(userId);

  return {
    bestTasksCompleted: snapshotBests.bestTasksCompleted ?? 0,
    bestFocusMinutes: snapshotBests.bestFocusMinutes ?? 0,
    bestCompletionRate: snapshotBests.bestCompletionRate ?? 0,
    bestStreak: streak?.longestStreak ?? 0,
  };
}
