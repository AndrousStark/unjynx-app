import { eq, and, count, asc, inArray } from "drizzle-orm";
import { db } from "../../db/index.js";
import {
  subtasks,
  tasks,
  type Subtask,
  type NewSubtask,
} from "../../db/schema/index.js";

export async function insertSubtask(
  userId: string,
  taskId: string,
  data: Pick<NewSubtask, "title">,
): Promise<Subtask | undefined> {
  // Verify the task belongs to the user
  const [task] = await db
    .select({ id: tasks.id })
    .from(tasks)
    .where(and(eq(tasks.id, taskId), eq(tasks.userId, userId)));

  if (!task) {
    return undefined;
  }

  const [created] = await db
    .insert(subtasks)
    .values({
      taskId,
      userId,
      title: data.title,
    })
    .returning();

  return created;
}

export async function findSubtasksByTaskId(
  userId: string,
  taskId: string,
  limit: number,
  offset: number,
): Promise<{ items: Subtask[]; total: number }> {
  const where = and(
    eq(subtasks.taskId, taskId),
    eq(subtasks.userId, userId),
  );

  const [items, [{ total }]] = await Promise.all([
    db
      .select()
      .from(subtasks)
      .where(where)
      .orderBy(asc(subtasks.sortOrder), asc(subtasks.createdAt))
      .limit(limit)
      .offset(offset),
    db.select({ total: count() }).from(subtasks).where(where),
  ]);

  return { items, total };
}

export async function findSubtaskById(
  userId: string,
  subtaskId: string,
): Promise<Subtask | undefined> {
  const [subtask] = await db
    .select()
    .from(subtasks)
    .where(and(eq(subtasks.id, subtaskId), eq(subtasks.userId, userId)));

  return subtask;
}

export async function updateSubtaskById(
  userId: string,
  subtaskId: string,
  data: Partial<NewSubtask> & { updatedAt: Date },
): Promise<Subtask | undefined> {
  const [updated] = await db
    .update(subtasks)
    .set(data)
    .where(and(eq(subtasks.id, subtaskId), eq(subtasks.userId, userId)))
    .returning();

  return updated;
}

export async function deleteSubtaskById(
  userId: string,
  subtaskId: string,
): Promise<boolean> {
  const result = await db
    .delete(subtasks)
    .where(and(eq(subtasks.id, subtaskId), eq(subtasks.userId, userId)))
    .returning({ id: subtasks.id });

  return result.length > 0;
}

export async function reorderSubtasks(
  userId: string,
  taskId: string,
  ids: readonly string[],
): Promise<boolean> {
  // Verify the task belongs to the user
  const [task] = await db
    .select({ id: tasks.id })
    .from(tasks)
    .where(and(eq(tasks.id, taskId), eq(tasks.userId, userId)));

  if (!task) {
    return false;
  }

  // Verify all subtask IDs belong to this task and user
  const existing = await db
    .select({ id: subtasks.id })
    .from(subtasks)
    .where(
      and(
        eq(subtasks.taskId, taskId),
        eq(subtasks.userId, userId),
        inArray(subtasks.id, ids as string[]),
      ),
    );

  if (existing.length !== ids.length) {
    return false;
  }

  // Update sortOrder based on position in the ids array
  await db.transaction(async (tx) => {
    for (let i = 0; i < ids.length; i++) {
      await tx
        .update(subtasks)
        .set({ sortOrder: i, updatedAt: new Date() })
        .where(
          and(
            eq(subtasks.id, ids[i]),
            eq(subtasks.userId, userId),
          ),
        );
    }
  });

  return true;
}

export async function countSubtasksByTaskId(
  userId: string,
  taskId: string,
): Promise<{ total: number; completed: number }> {
  const where = and(
    eq(subtasks.taskId, taskId),
    eq(subtasks.userId, userId),
  );

  const completedWhere = and(
    eq(subtasks.taskId, taskId),
    eq(subtasks.userId, userId),
    eq(subtasks.isCompleted, true),
  );

  const [[{ total }], [{ completed }]] = await Promise.all([
    db.select({ total: count() }).from(subtasks).where(where),
    db.select({ completed: count() }).from(subtasks).where(completedWhere),
  ]);

  return { total, completed };
}
