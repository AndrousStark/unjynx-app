// ── Sprint Service ───────────────────────────────────────────────────
//
// Sprint lifecycle management for Scrum projects:
//   - CRUD for sprints
//   - Add/remove tasks from sprints
//   - Daily burndown snapshot capture
//   - Sprint completion (auto-move incomplete tasks)
//   - Sprint retrospective

import { eq, and, desc, isNull, sql } from "drizzle-orm";
import { db } from "../../db/index.js";
import {
  sprints,
  sprintTasks,
  sprintBurndown,
  tasks,
  type Sprint,
  type SprintTask,
  type SprintBurndownEntry,
} from "../../db/schema/index.js";
import { logger } from "../../middleware/logger.js";

const log = logger.child({ module: "sprints" });

// ── CRUD ─────────────────────────────────────────────────────────────

export async function createSprint(
  orgId: string,
  projectId: string,
  data: { name: string; goal?: string; startDate?: string; endDate?: string },
): Promise<Sprint> {
  const [sprint] = await db
    .insert(sprints)
    .values({
      orgId,
      projectId,
      name: data.name,
      goal: data.goal,
      startDate: data.startDate ? new Date(data.startDate) : undefined,
      endDate: data.endDate ? new Date(data.endDate) : undefined,
    })
    .returning();

  log.info({ orgId, projectId, sprintId: sprint.id, name: data.name }, "Sprint created");
  return sprint;
}

export async function getSprints(
  orgId: string,
  projectId: string,
): Promise<readonly Sprint[]> {
  return db
    .select()
    .from(sprints)
    .where(
      and(eq(sprints.orgId, orgId), eq(sprints.projectId, projectId)),
    )
    .orderBy(desc(sprints.createdAt));
}

export async function getSprint(sprintId: string): Promise<Sprint | null> {
  const [sprint] = await db
    .select()
    .from(sprints)
    .where(eq(sprints.id, sprintId))
    .limit(1);
  return sprint ?? null;
}

export async function getActiveSprint(
  orgId: string,
  projectId: string,
): Promise<Sprint | null> {
  const [sprint] = await db
    .select()
    .from(sprints)
    .where(
      and(
        eq(sprints.orgId, orgId),
        eq(sprints.projectId, projectId),
        eq(sprints.status, "active"),
      ),
    )
    .limit(1);
  return sprint ?? null;
}

export async function updateSprint(
  sprintId: string,
  data: {
    name?: string;
    goal?: string;
    startDate?: string;
    endDate?: string;
  },
): Promise<Sprint> {
  const [updated] = await db
    .update(sprints)
    .set({
      ...(data.name !== undefined ? { name: data.name } : {}),
      ...(data.goal !== undefined ? { goal: data.goal } : {}),
      ...(data.startDate !== undefined ? { startDate: new Date(data.startDate) } : {}),
      ...(data.endDate !== undefined ? { endDate: new Date(data.endDate) } : {}),
      updatedAt: new Date(),
    })
    .where(eq(sprints.id, sprintId))
    .returning();

  if (!updated) throw new Error("Sprint not found");
  return updated;
}

// ── Sprint Lifecycle ─────────────────────────────────────────────────

export async function startSprint(
  sprintId: string,
  orgId: string,
  projectId: string,
): Promise<Sprint> {
  // Ensure no other active sprint in this project
  const existing = await getActiveSprint(orgId, projectId);
  if (existing && existing.id !== sprintId) {
    throw new Error("Another sprint is already active in this project. Complete it first.");
  }

  // Count committed points
  const taskRows = await db
    .select({ points: tasks.estimatePoints })
    .from(sprintTasks)
    .innerJoin(tasks, eq(sprintTasks.taskId, tasks.id))
    .where(
      and(eq(sprintTasks.sprintId, sprintId), isNull(sprintTasks.removedAt)),
    );

  const committedPoints = taskRows.reduce((sum, r) => sum + (r.points ?? 0), 0);

  const [started] = await db
    .update(sprints)
    .set({
      status: "active",
      startDate: new Date(),
      committedPoints,
      updatedAt: new Date(),
    })
    .where(eq(sprints.id, sprintId))
    .returning();

  if (!started) throw new Error("Sprint not found");

  // Capture initial burndown snapshot
  await captureBurndownSnapshot(sprintId, started.orgId);

  log.info({ sprintId, committedPoints }, "Sprint started");
  return started;
}

export async function completeSprint(
  sprintId: string,
  moveIncompleteToSprintId?: string,
): Promise<{ sprint: Sprint; incompleteMoved: number }> {
  const sprint = await getSprint(sprintId);
  if (!sprint) throw new Error("Sprint not found");
  if (sprint.status !== "active") throw new Error("Sprint is not active");

  // Find incomplete tasks in this sprint
  const incompleteTasks = await db
    .select({ taskId: sprintTasks.taskId })
    .from(sprintTasks)
    .innerJoin(tasks, eq(sprintTasks.taskId, tasks.id))
    .where(
      and(
        eq(sprintTasks.sprintId, sprintId),
        isNull(sprintTasks.removedAt),
        sql`${tasks.status} != 'completed'`,
      ),
    );

  // Count completed points
  const completedTasks = await db
    .select({ points: tasks.estimatePoints })
    .from(sprintTasks)
    .innerJoin(tasks, eq(sprintTasks.taskId, tasks.id))
    .where(
      and(
        eq(sprintTasks.sprintId, sprintId),
        isNull(sprintTasks.removedAt),
        eq(tasks.status, "completed"),
      ),
    );

  const completedPoints = completedTasks.reduce((sum, r) => sum + (r.points ?? 0), 0);

  // Mark sprint as completed
  const [completed] = await db
    .update(sprints)
    .set({
      status: "completed",
      endDate: new Date(),
      completedPoints,
      updatedAt: new Date(),
    })
    .where(eq(sprints.id, sprintId))
    .returning();

  // Move incomplete tasks to next sprint or remove from sprint
  let incompleteMoved = 0;
  if (moveIncompleteToSprintId && incompleteTasks.length > 0) {
    for (const { taskId } of incompleteTasks) {
      // Remove from current sprint
      await db
        .update(sprintTasks)
        .set({ removedAt: new Date() })
        .where(
          and(eq(sprintTasks.sprintId, sprintId), eq(sprintTasks.taskId, taskId)),
        );

      // Add to next sprint
      await db
        .insert(sprintTasks)
        .values({
          sprintId: moveIncompleteToSprintId,
          taskId,
          orgId: sprint.orgId,
        })
        .onConflictDoNothing();

      // Update task's sprint reference
      await db
        .update(tasks)
        .set({ sprintId: moveIncompleteToSprintId, updatedAt: new Date() })
        .where(eq(tasks.id, taskId));

      incompleteMoved++;
    }
  }

  log.info(
    { sprintId, completedPoints, incompleteMoved },
    "Sprint completed",
  );

  return { sprint: completed, incompleteMoved };
}

// ── Sprint Tasks ─────────────────────────────────────────────────────

export async function addTaskToSprint(
  sprintId: string,
  taskId: string,
  orgId: string,
): Promise<SprintTask> {
  const [entry] = await db
    .insert(sprintTasks)
    .values({ sprintId, taskId, orgId })
    .onConflictDoNothing()
    .returning();

  // Update task's sprint reference
  await db
    .update(tasks)
    .set({ sprintId, updatedAt: new Date() })
    .where(eq(tasks.id, taskId));

  return entry ?? { sprintId, taskId, orgId, addedAt: new Date(), removedAt: null };
}

export async function removeTaskFromSprint(
  sprintId: string,
  taskId: string,
): Promise<void> {
  await db
    .update(sprintTasks)
    .set({ removedAt: new Date() })
    .where(
      and(eq(sprintTasks.sprintId, sprintId), eq(sprintTasks.taskId, taskId)),
    );

  // Clear task's sprint reference
  await db
    .update(tasks)
    .set({ sprintId: null, updatedAt: new Date() })
    .where(and(eq(tasks.id, taskId), eq(tasks.sprintId, sprintId)));
}

export async function getSprintTasks(
  sprintId: string,
): Promise<readonly (SprintTask & { task: { id: string; title: string; status: string; priority: string; estimatePoints: number | null; assigneeId: string | null } })[]> {
  const rows = await db
    .select({
      sprintId: sprintTasks.sprintId,
      taskId: sprintTasks.taskId,
      orgId: sprintTasks.orgId,
      addedAt: sprintTasks.addedAt,
      removedAt: sprintTasks.removedAt,
      task: {
        id: tasks.id,
        title: tasks.title,
        status: tasks.status,
        priority: tasks.priority,
        estimatePoints: tasks.estimatePoints,
        assigneeId: tasks.assigneeId,
      },
    })
    .from(sprintTasks)
    .innerJoin(tasks, eq(sprintTasks.taskId, tasks.id))
    .where(
      and(eq(sprintTasks.sprintId, sprintId), isNull(sprintTasks.removedAt)),
    );

  return rows;
}

// ── Burndown ─────────────────────────────────────────────────────────

export async function captureBurndownSnapshot(
  sprintId: string,
  orgId: string,
): Promise<SprintBurndownEntry> {
  const today = new Date().toISOString().slice(0, 10);

  // Calculate current points
  const taskRows = await db
    .select({
      points: tasks.estimatePoints,
      status: tasks.status,
    })
    .from(sprintTasks)
    .innerJoin(tasks, eq(sprintTasks.taskId, tasks.id))
    .where(
      and(eq(sprintTasks.sprintId, sprintId), isNull(sprintTasks.removedAt)),
    );

  const totalPoints = taskRows.reduce((s, r) => s + (r.points ?? 0), 0);
  const completedPoints = taskRows
    .filter((r) => r.status === "completed")
    .reduce((s, r) => s + (r.points ?? 0), 0);
  const remainingPoints = totalPoints - completedPoints;

  // Upsert (one snapshot per day)
  const [snapshot] = await db
    .insert(sprintBurndown)
    .values({
      orgId,
      sprintId,
      capturedAt: today,
      totalPoints,
      completedPoints,
      remainingPoints,
      addedPoints: 0,
      removedPoints: 0,
    })
    .onConflictDoNothing()
    .returning();

  // If already exists today, update it
  if (!snapshot) {
    const [updated] = await db
      .update(sprintBurndown)
      .set({ totalPoints, completedPoints, remainingPoints })
      .where(
        and(
          eq(sprintBurndown.sprintId, sprintId),
          eq(sprintBurndown.capturedAt, today),
        ),
      )
      .returning();
    return updated;
  }

  return snapshot;
}

export async function getBurndownData(
  sprintId: string,
): Promise<readonly SprintBurndownEntry[]> {
  return db
    .select()
    .from(sprintBurndown)
    .where(eq(sprintBurndown.sprintId, sprintId))
    .orderBy(sprintBurndown.capturedAt);
}

// ── Retrospective ────────────────────────────────────────────────────

export async function saveRetrospective(
  sprintId: string,
  data: { wentWell?: string; toImprove?: string; actionItems?: string[] },
): Promise<Sprint> {
  const [updated] = await db
    .update(sprints)
    .set({
      retroWentWell: data.wentWell,
      retroToImprove: data.toImprove,
      retroActionItems: data.actionItems ?? [],
      updatedAt: new Date(),
    })
    .where(eq(sprints.id, sprintId))
    .returning();

  if (!updated) throw new Error("Sprint not found");
  log.info({ sprintId }, "Retrospective saved");
  return updated;
}

// ── Velocity ─────────────────────────────────────────────────────────

export async function getVelocity(
  orgId: string,
  projectId: string,
  limit: number = 10,
): Promise<readonly { name: string; committed: number; completed: number }[]> {
  const completedSprints = await db
    .select({
      name: sprints.name,
      committed: sprints.committedPoints,
      completed: sprints.completedPoints,
    })
    .from(sprints)
    .where(
      and(
        eq(sprints.orgId, orgId),
        eq(sprints.projectId, projectId),
        eq(sprints.status, "completed"),
      ),
    )
    .orderBy(desc(sprints.updatedAt))
    .limit(limit);

  return completedSprints;
}
