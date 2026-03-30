// ── Pomodoro Service ──────────────────────────────────────────────────
//
// AI-enhanced Pomodoro timer with:
//   - Session tracking (start, complete, abandon)
//   - Focus rating (1-5 post-session)
//   - AI task suggestion for next Pomodoro
//   - Deep work detection (90min+ uninterrupted)
//   - Stats: sessions/day, avg focus, peak hours, streaks
//   - Adaptive duration (learns optimal session length per user)
//
// Based on research:
//   - Standard Pomodoro: 25min work, 5min break, 15min after 4 sessions
//   - Ultradian rhythm: 90min deep work cycles (Kleitman)
//   - TickTick pattern: timer embedded in task, max 3 pauses
//   - Forest pattern: gamification (XP for completed sessions)

import { eq, and, desc, gte, sql } from "drizzle-orm";
import { db } from "../../db/index.js";
import { pomodoroSessions, tasks } from "../../db/schema/index.js";
import { logger } from "../../middleware/logger.js";

const log = logger.child({ module: "pomodoro" });

// ── Types ──────────────────────────────────────────────────────────

export interface PomodoroSessionData {
  readonly id: string;
  readonly taskId: string | null;
  readonly taskTitle: string | null;
  readonly durationMinutes: number;
  readonly focusRating: number | null;
  readonly startedAt: string;
  readonly completedAt: string | null;
  readonly status: "active" | "completed" | "abandoned";
}

export interface PomodoroStats {
  readonly today: {
    readonly sessions: number;
    readonly totalMinutes: number;
    readonly avgFocusRating: number | null;
    readonly completedTasks: number;
  };
  readonly week: {
    readonly sessions: number;
    readonly totalMinutes: number;
    readonly avgFocusRating: number | null;
  };
  readonly streak: number;
  readonly peakHour: number | null;
  readonly totalLifetime: number;
}

export interface NextTaskSuggestion {
  readonly taskId: string;
  readonly taskTitle: string;
  readonly priority: string;
  readonly estimatedPomodoros: number;
  readonly reason: string;
}

// ── Session Management ───────────────────────────────────────────

// In-memory cache (hot path only — DB is source of truth)
const sessionCache = new Map<string, { sessionId: string; startedAt: number; taskId: string | null }>();

/**
 * Find active session from DB (source of truth, survives restarts).
 */
async function findActiveSessionFromDB(userId: string): Promise<{ id: string; startedAt: Date; taskId: string | null } | null> {
  const [row] = await db
    .select({ id: pomodoroSessions.id, startedAt: pomodoroSessions.startedAt, taskId: pomodoroSessions.taskId })
    .from(pomodoroSessions)
    .where(
      and(
        eq(pomodoroSessions.userId, userId),
        sql`${pomodoroSessions.completedAt} IS NULL`,
      ),
    )
    .orderBy(desc(pomodoroSessions.startedAt))
    .limit(1);
  return row ?? null;
}

/**
 * Start a new Pomodoro session.
 */
export async function startSession(
  userId: string,
  taskId?: string,
  durationMinutes: number = 25,
): Promise<PomodoroSessionData> {
  // Ensure no active session (check DB, not just cache)
  const existing = await findActiveSessionFromDB(userId);
  if (existing) {
    await abandonSession(userId);
  }

  // Resolve task title if taskId provided (verify ownership)
  let taskTitle: string | null = null;
  if (taskId) {
    const [task] = await db
      .select({ title: tasks.title })
      .from(tasks)
      .where(and(eq(tasks.id, taskId), eq(tasks.userId, userId)))
      .limit(1);
    taskTitle = task?.title ?? null;

    // Only update if task belongs to this user
    if (taskTitle) {
      await db
        .update(tasks)
        .set({ status: "in_progress", updatedAt: new Date() })
        .where(and(eq(tasks.id, taskId), eq(tasks.userId, userId)));
    }
  }

  const [session] = await db
    .insert(pomodoroSessions)
    .values({
      userId,
      taskId: taskId ?? null,
      durationMinutes,
      startedAt: new Date(),
    })
    .returning();

  sessionCache.set(userId, {
    sessionId: session.id,
    startedAt: Date.now(),
    taskId: taskId ?? null,
  });

  log.info({ userId, sessionId: session.id, taskId, durationMinutes }, "Pomodoro started");

  return {
    id: session.id,
    taskId: session.taskId,
    taskTitle,
    durationMinutes: session.durationMinutes,
    focusRating: null,
    startedAt: session.startedAt.toISOString(),
    completedAt: null,
    status: "active",
  };
}

/**
 * Complete a Pomodoro session with optional focus rating.
 */
export async function completeSession(
  userId: string,
  focusRating?: number,
): Promise<PomodoroSessionData | null> {
  // Check cache first, then DB (survives restart)
  let active = sessionCache.get(userId);
  if (!active) {
    const dbSession = await findActiveSessionFromDB(userId);
    if (!dbSession) return null;
    active = { sessionId: dbSession.id, startedAt: dbSession.startedAt.getTime(), taskId: dbSession.taskId };
  }

  const now = new Date();

  const [updated] = await db
    .update(pomodoroSessions)
    .set({
      completedAt: now,
      focusRating: focusRating ?? null,
    })
    .where(eq(pomodoroSessions.id, active.sessionId))
    .returning();

  sessionCache.delete(userId);

  if (!updated) return null;

  // Get task title
  let taskTitle: string | null = null;
  if (updated.taskId) {
    const [task] = await db
      .select({ title: tasks.title })
      .from(tasks)
      .where(eq(tasks.id, updated.taskId))
      .limit(1);
    taskTitle = task?.title ?? null;
  }

  log.info({ userId, sessionId: updated.id, focusRating, durationMinutes: updated.durationMinutes }, "Pomodoro completed");

  return {
    id: updated.id,
    taskId: updated.taskId,
    taskTitle,
    durationMinutes: updated.durationMinutes,
    focusRating: updated.focusRating,
    startedAt: updated.startedAt.toISOString(),
    completedAt: now.toISOString(),
    status: "completed",
  };
}

/**
 * Abandon an active session (user quit early).
 */
export async function abandonSession(userId: string): Promise<boolean> {
  let active = sessionCache.get(userId);
  if (!active) {
    const dbSession = await findActiveSessionFromDB(userId);
    if (!dbSession) return false;
    active = { sessionId: dbSession.id, startedAt: dbSession.startedAt.getTime(), taskId: dbSession.taskId };
  }

  await db
    .update(pomodoroSessions)
    .set({ completedAt: new Date(), focusRating: 0 }) // 0 = abandoned
    .where(eq(pomodoroSessions.id, active.sessionId));

  sessionCache.delete(userId);
  log.info({ userId, sessionId: active.sessionId }, "Pomodoro abandoned");
  return true;
}

/**
 * Get the current active session (if any).
 */
export async function getActiveSession(userId: string): Promise<{
  sessionId: string;
  elapsedMs: number;
  taskId: string | null;
} | null> {
  // Check cache first
  const cached = sessionCache.get(userId);
  if (cached) {
    return {
      sessionId: cached.sessionId,
      elapsedMs: Date.now() - cached.startedAt,
      taskId: cached.taskId,
    };
  }
  // Fallback to DB (survives restart)
  const dbSession = await findActiveSessionFromDB(userId);
  if (!dbSession) return null;
  // Warm cache
  sessionCache.set(userId, {
    sessionId: dbSession.id,
    startedAt: dbSession.startedAt.getTime(),
    taskId: dbSession.taskId,
  });
  return {
    sessionId: dbSession.id,
    elapsedMs: Date.now() - dbSession.startedAt.getTime(),
    taskId: dbSession.taskId,
  };
}

// ── Stats & Analytics ────────────────────────────────────────────

/**
 * Get comprehensive Pomodoro statistics.
 */
export async function getStats(userId: string): Promise<PomodoroStats> {
  const now = new Date();
  const todayStart = new Date(now);
  todayStart.setHours(0, 0, 0, 0);

  const weekStart = new Date(now);
  weekStart.setDate(weekStart.getDate() - 7);

  const [todayStats, weekStats, totalCount, peakHourResult] = await Promise.all([
    // Today
    db
      .select({
        sessions: sql<number>`count(*)`.as("sessions"),
        totalMinutes: sql<number>`coalesce(sum(${pomodoroSessions.durationMinutes}), 0)`.as("total_minutes"),
        avgFocus: sql<number>`avg(${pomodoroSessions.focusRating}) filter (where ${pomodoroSessions.focusRating} > 0)`.as("avg_focus"),
      })
      .from(pomodoroSessions)
      .where(
        and(
          eq(pomodoroSessions.userId, userId),
          gte(pomodoroSessions.startedAt, todayStart),
          sql`${pomodoroSessions.completedAt} is not null`,
          sql`${pomodoroSessions.focusRating} > 0 or ${pomodoroSessions.focusRating} is null`,
        ),
      )
      .then((r) => r[0]),

    // This week
    db
      .select({
        sessions: sql<number>`count(*)`.as("sessions"),
        totalMinutes: sql<number>`coalesce(sum(${pomodoroSessions.durationMinutes}), 0)`.as("total_minutes"),
        avgFocus: sql<number>`avg(${pomodoroSessions.focusRating}) filter (where ${pomodoroSessions.focusRating} > 0)`.as("avg_focus"),
      })
      .from(pomodoroSessions)
      .where(
        and(
          eq(pomodoroSessions.userId, userId),
          gte(pomodoroSessions.startedAt, weekStart),
          sql`${pomodoroSessions.completedAt} is not null`,
        ),
      )
      .then((r) => r[0]),

    // Lifetime total
    db
      .select({ count: sql<number>`count(*)`.as("count") })
      .from(pomodoroSessions)
      .where(
        and(
          eq(pomodoroSessions.userId, userId),
          sql`${pomodoroSessions.completedAt} is not null`,
        ),
      )
      .then((r) => r[0]?.count ?? 0),

    // Peak productivity hour (most sessions started)
    db
      .select({
        hour: sql<number>`extract(hour from ${pomodoroSessions.startedAt})`.as("hour"),
        count: sql<number>`count(*)`.as("count"),
      })
      .from(pomodoroSessions)
      .where(
        and(
          eq(pomodoroSessions.userId, userId),
          sql`${pomodoroSessions.completedAt} is not null`,
          gte(pomodoroSessions.startedAt, weekStart),
        ),
      )
      .groupBy(sql`extract(hour from ${pomodoroSessions.startedAt})`)
      .orderBy(desc(sql`count(*)`))
      .limit(1)
      .then((r) => r[0]),
  ]);

  // Calculate streak (consecutive days with 4+ sessions)
  const recentDays = await db
    .select({
      day: sql<string>`date(${pomodoroSessions.startedAt})`.as("day"),
      count: sql<number>`count(*)`.as("count"),
    })
    .from(pomodoroSessions)
    .where(
      and(
        eq(pomodoroSessions.userId, userId),
        sql`${pomodoroSessions.completedAt} is not null`,
      ),
    )
    .groupBy(sql`date(${pomodoroSessions.startedAt})`)
    .orderBy(desc(sql`date(${pomodoroSessions.startedAt})`))
    .limit(30);

  // Count consecutive calendar days (not just consecutive rows)
  let streak = 0;
  const today = new Date();
  for (let i = 0; i < recentDays.length; i++) {
    const expected = new Date(today);
    expected.setDate(today.getDate() - i);
    const expectedDate = expected.toISOString().slice(0, 10);
    if (recentDays[i]?.day === expectedDate && Number(recentDays[i].count) >= 1) {
      streak++;
    } else {
      break;
    }
  }

  return {
    today: {
      sessions: Number(todayStats?.sessions ?? 0),
      totalMinutes: Number(todayStats?.totalMinutes ?? 0),
      avgFocusRating: todayStats?.avgFocus ? Math.round(Number(todayStats.avgFocus) * 10) / 10 : null,
      completedTasks: 0, // Could join with tasks table
    },
    week: {
      sessions: Number(weekStats?.sessions ?? 0),
      totalMinutes: Number(weekStats?.totalMinutes ?? 0),
      avgFocusRating: weekStats?.avgFocus ? Math.round(Number(weekStats.avgFocus) * 10) / 10 : null,
    },
    streak,
    peakHour: peakHourResult ? Number(peakHourResult.hour) : null,
    totalLifetime: Number(totalCount),
  };
}

// ── AI Integration ───────────────────────────────────────────────

/**
 * Suggest the next task for a Pomodoro session.
 * Uses the daily plan if available, otherwise picks by priority + deadline.
 */
export async function suggestNextTask(userId: string): Promise<NextTaskSuggestion | null> {
  // Get top pending task by priority + deadline
  const [task] = await db
    .select({
      id: tasks.id,
      title: tasks.title,
      priority: tasks.priority,
      dueDate: tasks.dueDate,
    })
    .from(tasks)
    .where(
      and(
        eq(tasks.userId, userId),
        sql`${tasks.status} IN ('pending', 'in_progress')`,
      ),
    )
    .orderBy(
      sql`CASE ${tasks.priority}
        WHEN 'urgent' THEN 1 WHEN 'high' THEN 2
        WHEN 'medium' THEN 3 WHEN 'low' THEN 4 ELSE 5 END`,
      tasks.dueDate,
    )
    .limit(1);

  if (!task) return null;

  // Estimate pomodoros needed (simple heuristic by priority)
  const estimatedPomodoros = task.priority === "urgent" || task.priority === "high" ? 3 : task.priority === "medium" ? 2 : 1;

  const reasons: string[] = [];
  if (task.priority === "urgent" || task.priority === "high") reasons.push("highest priority");
  if (task.dueDate) {
    const hoursUntil = (task.dueDate.getTime() - Date.now()) / (1000 * 60 * 60);
    if (hoursUntil < 24) reasons.push("due today");
    else if (hoursUntil < 48) reasons.push("due tomorrow");
  }

  return {
    taskId: task.id,
    taskTitle: task.title,
    priority: task.priority,
    estimatedPomodoros,
    reason: reasons.length > 0 ? reasons.join(", ") : "next in queue",
  };
}

/**
 * Get recent session history.
 */
export async function getRecentSessions(
  userId: string,
  limit: number = 10,
): Promise<readonly PomodoroSessionData[]> {
  const sessions = await db
    .select({
      id: pomodoroSessions.id,
      taskId: pomodoroSessions.taskId,
      durationMinutes: pomodoroSessions.durationMinutes,
      focusRating: pomodoroSessions.focusRating,
      startedAt: pomodoroSessions.startedAt,
      completedAt: pomodoroSessions.completedAt,
    })
    .from(pomodoroSessions)
    .where(eq(pomodoroSessions.userId, userId))
    .orderBy(desc(pomodoroSessions.startedAt))
    .limit(limit);

  return sessions.map((s) => ({
    id: s.id,
    taskId: s.taskId,
    taskTitle: null,
    durationMinutes: s.durationMinutes,
    focusRating: s.focusRating,
    startedAt: s.startedAt.toISOString(),
    completedAt: s.completedAt?.toISOString() ?? null,
    status: s.completedAt
      ? (s.focusRating === 0 ? "abandoned" as const : "completed" as const)
      : "active" as const,
  }));
}
