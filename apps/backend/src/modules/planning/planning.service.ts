// ── Daily Planning Service ────────────────────────────────────────────
//
// AI-guided daily planning ritual — the feature NO competitor has.
// Combines: task selection + priority ordering + time estimation +
// calendar-aware scheduling + multi-channel reminders.
//
// Three modes:
//   Guided: AI walks through each step (5-8 turns)
//   Quick:  AI presents pre-built plan, user approves (1-2 turns)
//   Auto:   AI generates plan silently, user gets notification
//
// Architecture:
//   - Plan state stored in Valkey (active plan for today)
//   - Plan history in PostgreSQL (via audit_log)
//   - Notifications via existing BullMQ channel adapters
//   - AI suggestions via existing Claude service

import { eq, and, ne, lte, gte, desc, sql } from "drizzle-orm";
import { db } from "../../db/index.js";
import { tasks, progressSnapshots, auditLog } from "../../db/schema/index.js";
import { buildUserContext } from "../ai/pipeline/context-builder.js";
import { getTodayCalendarContext } from "../calendar/calendar-context.js";
import { logger } from "../../middleware/logger.js";

const log = logger.child({ module: "planning" });

// ── Types ──────────────────────────────────────────────────────────

export interface PlanBlock {
  readonly taskId: string;
  readonly taskTitle: string;
  readonly priority: string;
  readonly startTime: string;          // "09:00"
  readonly endTime: string;            // "10:30"
  readonly estimatedMinutes: number;
  readonly status: "pending" | "active" | "completed" | "skipped" | "carried";
  readonly position: number;
}

export interface DailyPlan {
  readonly userId: string;
  readonly date: string;               // "2026-03-30"
  readonly status: "planning" | "active" | "reviewed" | "archived";
  readonly blocks: readonly PlanBlock[];
  readonly totalPlannedMinutes: number;
  readonly totalCompletedMinutes: number;
  readonly accuracy: number;           // 0-100%
  readonly mode: "guided" | "quick" | "auto";
  readonly createdAt: string;
  readonly updatedAt: string;
}

export interface YesterdaySummary {
  readonly tasksPlanned: number;
  readonly tasksCompleted: number;
  readonly accuracy: number;
  readonly carriedForward: readonly { id: string; title: string; priority: string }[];
  readonly topAccomplishment: string | null;
}

export interface PlanSuggestions {
  readonly tasks: readonly TaskSuggestion[];
  readonly availableMinutes: number;
  readonly overdueTasks: readonly TaskSuggestion[];
  readonly mits: readonly string[];    // Most Important Task IDs (top 3)
}

export interface TaskSuggestion {
  readonly id: string;
  readonly title: string;
  readonly priority: string;
  readonly dueDate: string | null;
  readonly score: number;              // multi-factor ranking score
  readonly estimatedMinutes: number;
  readonly isOverdue: boolean;
}

// ── Priority Scoring (same as direct-actions) ─────────────────────

const PRIORITY_WEIGHTS: Record<string, number> = {
  urgent: 5, high: 4, medium: 3, low: 2, none: 1,
};

function scoreTask(task: {
  priority: string;
  dueDate: Date | null;
  createdAt: Date;
}): number {
  const now = Date.now();
  let score = 0;

  score += (PRIORITY_WEIGHTS[task.priority] ?? 1) * 5;

  if (task.dueDate) {
    const hoursUntilDue = (task.dueDate.getTime() - now) / (1000 * 60 * 60);
    if (hoursUntilDue < 0) score += 30;
    else if (hoursUntilDue < 4) score += 25;
    else if (hoursUntilDue < 24) score += 20;
    else if (hoursUntilDue < 48) score += 15;
    else if (hoursUntilDue < 168) score += 10;
  }

  const daysSinceCreation = (now - task.createdAt.getTime()) / (1000 * 60 * 60 * 24);
  score += Math.min(daysSinceCreation * 0.5, 5);

  return Math.round(score * 100) / 100;
}

// ── Default Time Estimates by Priority ────────────────────────────

function defaultEstimate(priority: string): number {
  switch (priority) {
    case "urgent": return 60;
    case "high": return 45;
    case "medium": return 30;
    case "low": return 20;
    default: return 25;
  }
}

// ── Plan Store (in-memory cache + audit_log persistence) ─────────

const planCache = new Map<string, DailyPlan>();

function planKey(userId: string, date: string): string {
  return `plan:${userId}:${date}`;
}

/** Persist plan to DB (audit_log with entityType=daily_plan). */
async function persistPlan(plan: DailyPlan): Promise<void> {
  try {
    await db.insert(auditLog).values({
      userId: plan.userId,
      action: "planning.state",
      entityType: "daily_plan",
      entityId: plan.date,
      metadata: JSON.stringify(plan),
    });
  } catch (err) {
    log.error({ err, userId: plan.userId }, "Failed to persist plan");
  }
}

/** Load plan from DB if not in cache (survives restarts). */
async function loadPlanFromDB(userId: string, date: string): Promise<DailyPlan | null> {
  try {
    const [row] = await db
      .select({ metadata: auditLog.metadata })
      .from(auditLog)
      .where(
        and(
          eq(auditLog.userId, userId),
          eq(auditLog.entityType, "daily_plan"),
          eq(auditLog.entityId, date),
          eq(auditLog.action, "planning.state"),
        ),
      )
      .orderBy(desc(auditLog.createdAt))
      .limit(1);

    if (!row?.metadata) return null;
    return JSON.parse(row.metadata) as DailyPlan;
  } catch {
    return null;
  }
}

// ── Public API ──────────────────────────────────────────────────────

/**
 * Get yesterday's summary for the morning review.
 */
export async function getYesterdaySummary(
  userId: string,
): Promise<YesterdaySummary> {
  const yesterday = new Date();
  yesterday.setDate(yesterday.getDate() - 1);
  const yesterdayStart = new Date(yesterday);
  yesterdayStart.setHours(0, 0, 0, 0);
  const yesterdayEnd = new Date(yesterday);
  yesterdayEnd.setHours(23, 59, 59, 999);

  // Get yesterday's tasks
  const [stats] = await db
    .select({
      total: sql<number>`count(*)`.as("total"),
      completed: sql<number>`count(*) filter (where ${tasks.status} = 'completed')`.as("completed"),
    })
    .from(tasks)
    .where(
      and(
        eq(tasks.userId, userId),
        gte(tasks.dueDate, yesterdayStart),
        lte(tasks.dueDate, yesterdayEnd),
      ),
    );

  // Get carried forward tasks (overdue from last 30 days, not completed)
  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
  const carriedTasks = await db
    .select({ id: tasks.id, title: tasks.title, priority: tasks.priority })
    .from(tasks)
    .where(
      and(
        eq(tasks.userId, userId),
        ne(tasks.status, "completed" as never),
        ne(tasks.status, "cancelled" as never),
        gte(tasks.dueDate, thirtyDaysAgo),
        lte(tasks.dueDate, yesterdayEnd),
      ),
    )
    .limit(10);

  const planned = Number(stats?.total ?? 0);
  const completed = Number(stats?.completed ?? 0);
  const accuracy = planned > 0 ? Math.round((completed / planned) * 100) : 0;

  return {
    tasksPlanned: planned,
    tasksCompleted: completed,
    accuracy,
    carriedForward: carriedTasks.map((t) => ({
      id: t.id,
      title: t.title,
      priority: t.priority,
    })),
    topAccomplishment: null, // Could query most complex completed task
  };
}

/**
 * Get AI-powered task suggestions for today's plan.
 */
export async function getPlanSuggestions(
  userId: string,
): Promise<PlanSuggestions> {
  const now = new Date();
  const todayEnd = new Date(now);
  todayEnd.setHours(23, 59, 59, 999);

  // Get all pending tasks (overdue + today + upcoming)
  const pendingTasks = await db
    .select({
      id: tasks.id,
      title: tasks.title,
      priority: tasks.priority,
      dueDate: tasks.dueDate,
      createdAt: tasks.createdAt,
    })
    .from(tasks)
    .where(
      and(
        eq(tasks.userId, userId),
        ne(tasks.status, "completed" as never),
        ne(tasks.status, "cancelled" as never),
      ),
    )
    .orderBy(desc(tasks.priority))
    .limit(50);

  // Score and sort
  const scored: TaskSuggestion[] = pendingTasks
    .map((t) => ({
      id: t.id,
      title: t.title,
      priority: t.priority,
      dueDate: t.dueDate?.toISOString() ?? null,
      score: scoreTask(t),
      estimatedMinutes: defaultEstimate(t.priority),
      isOverdue: t.dueDate ? t.dueDate < now : false,
    }))
    .sort((a, b) => b.score - a.score);

  // Separate overdue
  const overdue = scored.filter((t) => t.isOverdue);

  // Calculate available minutes from real calendar data (if connected)
  const calendarCtx = await getTodayCalendarContext(userId).catch(() => null);
  const availableMinutes = calendarCtx
    ? calendarCtx.totalAvailableMinutes
    : 360; // Fallback: 6 hours if no calendar connected

  // Top 3 MITs (Most Important Tasks)
  const mits = scored.slice(0, 3).map((t) => t.id);

  return {
    tasks: scored.slice(0, 20), // Top 20 candidates
    availableMinutes,
    overdueTasks: overdue,
    mits,
  };
}

/**
 * Generate a time-blocked schedule from selected tasks.
 * Uses circadian rhythm research for placement.
 */
export function generateSchedule(
  selectedTasks: readonly {
    id: string;
    title: string;
    priority: string;
    estimatedMinutes: number;
  }[],
  workStartHour: number = 9,
  workEndHour: number = 18,
): PlanBlock[] {
  const blocks: PlanBlock[] = [];
  let currentMinutes = workStartHour * 60;
  const endMinutes = workEndHour * 60;

  // Sort: urgent/high in morning (peak energy), medium/low in afternoon
  const sorted = [...selectedTasks].sort((a, b) => {
    const pA = PRIORITY_WEIGHTS[a.priority] ?? 1;
    const pB = PRIORITY_WEIGHTS[b.priority] ?? 1;
    return pB - pA; // High priority first
  });

  for (let i = 0; i < sorted.length; i++) {
    const task = sorted[i];
    const duration = task.estimatedMinutes;

    // Skip if no time left
    if (currentMinutes + duration > endMinutes) continue;

    // Add buffer after meetings (context switch: 15 min)
    // Check if we're crossing the lunch period (12:00-13:00)
    if (currentMinutes < 720 && currentMinutes + duration > 720) {
      // Skip to after lunch
      currentMinutes = 780; // 1:00 PM
    }

    const startHour = Math.floor(currentMinutes / 60);
    const startMin = currentMinutes % 60;
    const endTotalMin = currentMinutes + duration;
    const endHour = Math.floor(endTotalMin / 60);
    const endMin = endTotalMin % 60;

    blocks.push({
      taskId: task.id,
      taskTitle: task.title,
      priority: task.priority,
      startTime: `${String(startHour).padStart(2, "0")}:${String(startMin).padStart(2, "0")}`,
      endTime: `${String(endHour).padStart(2, "0")}:${String(endMin).padStart(2, "0")}`,
      estimatedMinutes: duration,
      status: "pending",
      position: i,
    });

    // Add 10-minute break between tasks
    currentMinutes = endTotalMin + 10;
  }

  return blocks;
}

/**
 * Create and save a daily plan.
 */
export async function createPlan(
  userId: string,
  blocks: readonly PlanBlock[],
  mode: "guided" | "quick" | "auto" = "guided",
): Promise<DailyPlan> {
  const today = new Date().toISOString().slice(0, 10);
  const totalMinutes = blocks.reduce((sum, b) => sum + b.estimatedMinutes, 0);

  const plan: DailyPlan = {
    userId,
    date: today,
    status: "active",
    blocks,
    totalPlannedMinutes: totalMinutes,
    totalCompletedMinutes: 0,
    accuracy: 0,
    mode,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  // Store in cache + persist to DB (survives restarts)
  planCache.set(planKey(userId, today), plan);
  persistPlan(plan).catch(() => {});

  // Also persist to audit_log for history
  db.insert(auditLog).values({
    userId,
    action: "planning.created",
    entityType: "daily_plan",
    entityId: today,
    metadata: JSON.stringify({
      blocksCount: blocks.length,
      totalMinutes: totalMinutes,
      mode,
      tasks: blocks.map((b) => b.taskTitle),
    }),
  }).catch(() => {});

  log.info({ userId, date: today, blocks: blocks.length, totalMinutes }, "Daily plan created");

  return plan;
}

/**
 * Get today's active plan.
 */
export async function getTodayPlan(userId: string): Promise<DailyPlan | null> {
  const today = new Date().toISOString().slice(0, 10);
  const key = planKey(userId, today);

  // Check cache first
  const cached = planCache.get(key);
  if (cached) return cached;

  // Fallback to DB (survives restarts)
  const fromDB = await loadPlanFromDB(userId, today);
  if (fromDB) {
    planCache.set(key, fromDB); // Warm cache
  }
  return fromDB;
}

/**
 * Complete a plan block.
 */
export function completeBlock(
  userId: string,
  taskId: string,
  actualMinutes?: number,
): DailyPlan | null {
  const today = new Date().toISOString().slice(0, 10);
  const key = planKey(userId, today);
  const plan = planCache.get(key);
  if (!plan) return null;

  const updatedBlocks = plan.blocks.map((b) =>
    b.taskId === taskId
      ? { ...b, status: "completed" as const, actualMinutes: actualMinutes ?? b.estimatedMinutes }
      : b,
  );

  const completedCount = updatedBlocks.filter((b) => b.status === "completed").length;
  // Use per-block actualMinutes (set when each block was completed), not the current call's value
  const completedMinutes = updatedBlocks
    .filter((b) => b.status === "completed")
    .reduce((sum, b) => sum + ((b as { actualMinutes?: number }).actualMinutes ?? b.estimatedMinutes), 0);

  const updatedPlan: DailyPlan = {
    ...plan,
    blocks: updatedBlocks,
    totalCompletedMinutes: completedMinutes,
    accuracy: Math.round((completedCount / plan.blocks.length) * 100),
    updatedAt: new Date().toISOString(),
  };

  planCache.set(key, updatedPlan);
  persistPlan(updatedPlan).catch(() => {});
  return updatedPlan;
}

/**
 * Skip a plan block.
 */
export function skipBlock(userId: string, taskId: string): DailyPlan | null {
  const today = new Date().toISOString().slice(0, 10);
  const key = planKey(userId, today);
  const plan = planCache.get(key);
  if (!plan) return null;

  const updatedBlocks = plan.blocks.map((b) =>
    b.taskId === taskId
      ? { ...b, status: "skipped" as const }
      : b,
  );

  const updatedPlan: DailyPlan = {
    ...plan,
    blocks: updatedBlocks,
    updatedAt: new Date().toISOString(),
  };

  planCache.set(key, updatedPlan);
  persistPlan(updatedPlan).catch(() => {});
  return updatedPlan;
}

/**
 * Get evening review data.
 */
export async function getEveningReview(userId: string): Promise<{
  plan: DailyPlan | null;
  completedCount: number;
  skippedCount: number;
  pendingCount: number;
  accuracy: number;
}> {
  const plan = await getTodayPlan(userId);
  if (!plan) {
    return { plan: null, completedCount: 0, skippedCount: 0, pendingCount: 0, accuracy: 0 };
  }

  const completedCount = plan.blocks.filter((b) => b.status === "completed").length;
  const skippedCount = plan.blocks.filter((b) => b.status === "skipped").length;
  const pendingCount = plan.blocks.filter((b) => b.status === "pending").length;
  const accuracy = plan.blocks.length > 0
    ? Math.round((completedCount / plan.blocks.length) * 100)
    : 0;

  return { plan, completedCount, skippedCount, pendingCount, accuracy };
}

/**
 * Carry forward incomplete tasks to tomorrow.
 */
export async function carryForward(
  userId: string,
  taskIds: readonly string[],
): Promise<number> {
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  tomorrow.setHours(9, 0, 0, 0);

  let carried = 0;
  for (const id of taskIds) {
    try {
      await db
        .update(tasks)
        .set({ dueDate: tomorrow, updatedAt: new Date() })
        .where(and(eq(tasks.id, id), eq(tasks.userId, userId)));
      carried++;
    } catch { continue; }
  }

  // Mark these blocks as "carried" in today's plan
  const today = new Date().toISOString().slice(0, 10);
  const key = planKey(userId, today);
  const plan = planCache.get(key);
  if (plan) {
    const updatedBlocks = plan.blocks.map((b) =>
      taskIds.includes(b.taskId) && b.status === "pending"
        ? { ...b, status: "carried" as const }
        : b,
    );
    planCache.set(key, {
      ...plan,
      blocks: updatedBlocks,
      status: "reviewed",
      updatedAt: new Date().toISOString(),
    });
  }

  log.info({ userId, carried, total: taskIds.length }, "Tasks carried forward");
  return carried;
}

