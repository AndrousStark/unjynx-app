// ── Goals Service ────────────────────────────────────────────────────
//
// OKR-style goal management with auto-progress from linked tasks:
//   - CRUD for goals (company → team → individual hierarchy)
//   - Link tasks to goals
//   - Auto-calculate progress from linked task completion
//   - Get goal tree (parent + children)

import { eq, and, desc, isNull, sql } from "drizzle-orm";
import { db } from "../../db/index.js";
import {
  goals,
  goalTaskLinks,
  tasks,
  profiles,
  type Goal,
  type GoalTaskLink,
} from "../../db/schema/index.js";
import { logger } from "../../middleware/logger.js";

const log = logger.child({ module: "goals" });

// ── CRUD ─────────────────────────────────────────────────────────────

export async function createGoal(
  orgId: string,
  data: {
    title: string;
    description?: string;
    parentId?: string;
    ownerId?: string;
    targetValue?: string;
    unit?: string;
    level?: string;
    dueDate?: string;
  },
): Promise<Goal> {
  const [goal] = await db
    .insert(goals)
    .values({
      orgId,
      title: data.title,
      description: data.description,
      parentId: data.parentId,
      ownerId: data.ownerId,
      targetValue: data.targetValue,
      unit: data.unit ?? "%",
      level: data.level ?? "individual",
      dueDate: data.dueDate ? new Date(data.dueDate) : undefined,
    })
    .returning();

  log.info({ orgId, goalId: goal.id, title: data.title }, "Goal created");
  return goal;
}

export async function getGoals(
  orgId: string,
  options?: { level?: string; ownerId?: string; parentId?: string | null },
): Promise<readonly Goal[]> {
  const conditions = [
    eq(goals.orgId, orgId),
    eq(goals.isArchived, false),
  ];

  if (options?.level) conditions.push(eq(goals.level, options.level));
  if (options?.ownerId) conditions.push(eq(goals.ownerId, options.ownerId));
  if (options?.parentId === null) {
    conditions.push(isNull(goals.parentId));
  } else if (options?.parentId) {
    conditions.push(eq(goals.parentId, options.parentId));
  }

  return db
    .select()
    .from(goals)
    .where(and(...conditions))
    .orderBy(goals.sortOrder, desc(goals.createdAt));
}

export async function getGoal(goalId: string): Promise<Goal | null> {
  const [goal] = await db
    .select()
    .from(goals)
    .where(eq(goals.id, goalId))
    .limit(1);
  return goal ?? null;
}

export async function updateGoal(
  goalId: string,
  data: {
    title?: string;
    description?: string;
    ownerId?: string;
    targetValue?: string;
    currentValue?: string;
    unit?: string;
    status?: string;
    dueDate?: string;
  },
): Promise<Goal> {
  const setData: Record<string, unknown> = { updatedAt: new Date() };
  if (data.title !== undefined) setData.title = data.title;
  if (data.description !== undefined) setData.description = data.description;
  if (data.ownerId !== undefined) setData.ownerId = data.ownerId;
  if (data.targetValue !== undefined) setData.targetValue = data.targetValue;
  if (data.currentValue !== undefined) setData.currentValue = data.currentValue;
  if (data.unit !== undefined) setData.unit = data.unit;
  if (data.status !== undefined) setData.status = data.status;
  if (data.dueDate !== undefined) setData.dueDate = new Date(data.dueDate);

  // Auto-set completedAt when status changes to completed
  if (data.status === "completed") setData.completedAt = new Date();

  const [updated] = await db
    .update(goals)
    .set(setData as Partial<Goal>)
    .where(eq(goals.id, goalId))
    .returning();

  if (!updated) throw new Error("Goal not found");
  return updated;
}

export async function archiveGoal(goalId: string): Promise<void> {
  await db
    .update(goals)
    .set({ isArchived: true, updatedAt: new Date() })
    .where(eq(goals.id, goalId));
}

// ── Goal Hierarchy ───────────────────────────────────────────────────

export interface GoalWithChildren extends Goal {
  readonly children: readonly Goal[];
  readonly ownerName: string | null;
  readonly progressPercent: number;
}

export async function getGoalTree(
  orgId: string,
): Promise<readonly GoalWithChildren[]> {
  // Get all top-level goals (no parent)
  const topLevel = await getGoals(orgId, { parentId: null });

  const tree: GoalWithChildren[] = [];
  for (const goal of topLevel) {
    const children = await getGoals(orgId, { parentId: goal.id });
    const [owner] = goal.ownerId
      ? await db.select({ name: profiles.name }).from(profiles).where(eq(profiles.id, goal.ownerId)).limit(1)
      : [null];

    const progressPercent = calculateProgress(goal);

    tree.push({
      ...goal,
      children,
      ownerName: owner?.name ?? null,
      progressPercent,
    });
  }

  return tree;
}

function calculateProgress(goal: Goal): number {
  const target = Number(goal.targetValue ?? 100);
  const current = Number(goal.currentValue ?? 0);
  if (target <= 0) return 0;
  return Math.min(100, Math.round((current / target) * 100));
}

// ── Goal ↔ Task Links ────────────────────────────────────────────────

export async function linkTaskToGoal(
  orgId: string,
  goalId: string,
  taskId: string,
): Promise<GoalTaskLink> {
  const [link] = await db
    .insert(goalTaskLinks)
    .values({ orgId, goalId, taskId })
    .onConflictDoNothing()
    .returning();

  // Recalculate progress
  await recalculateGoalProgress(goalId);

  return link ?? { id: "", orgId, goalId, taskId, createdAt: new Date() };
}

export async function unlinkTaskFromGoal(
  goalId: string,
  taskId: string,
): Promise<void> {
  await db
    .delete(goalTaskLinks)
    .where(and(eq(goalTaskLinks.goalId, goalId), eq(goalTaskLinks.taskId, taskId)));

  await recalculateGoalProgress(goalId);
}

export async function getGoalTasks(
  goalId: string,
): Promise<readonly { taskId: string; title: string; status: string; priority: string }[]> {
  const rows = await db
    .select({
      taskId: goalTaskLinks.taskId,
      title: tasks.title,
      status: tasks.status,
      priority: tasks.priority,
    })
    .from(goalTaskLinks)
    .innerJoin(tasks, eq(goalTaskLinks.taskId, tasks.id))
    .where(eq(goalTaskLinks.goalId, goalId));

  return rows;
}

/**
 * Recalculate goal progress from linked task completion.
 * Progress = (completed tasks / total linked tasks) * target_value
 */
export async function recalculateGoalProgress(goalId: string): Promise<void> {
  const [goal] = await db
    .select({ targetValue: goals.targetValue })
    .from(goals)
    .where(eq(goals.id, goalId))
    .limit(1);

  if (!goal) return;

  const [counts] = await db
    .select({
      total: sql<number>`count(*)`,
      completed: sql<number>`count(*) filter (where ${tasks.status} = 'completed')`,
    })
    .from(goalTaskLinks)
    .innerJoin(tasks, eq(goalTaskLinks.taskId, tasks.id))
    .where(eq(goalTaskLinks.goalId, goalId));

  const total = Number(counts?.total ?? 0);
  const completed = Number(counts?.completed ?? 0);

  if (total === 0) return;

  const target = Number(goal.targetValue ?? 100);
  const newValue = Math.round((completed / total) * target * 100) / 100;

  // Update progress + auto-update status
  const status = newValue >= target ? "completed" : newValue > 0 ? "on_track" : "on_track";

  await db
    .update(goals)
    .set({
      currentValue: String(newValue),
      status,
      completedAt: newValue >= target ? new Date() : null,
      updatedAt: new Date(),
    })
    .where(eq(goals.id, goalId));
}
