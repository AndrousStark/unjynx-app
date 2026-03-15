import { eq, and, desc, count, inArray } from "drizzle-orm";
import { db } from "../../db/index.js";
import {
  tasks,
  profiles,
  type Task,
  type NewTask,
} from "../../db/schema/index.js";

export async function findAllUserTasks(
  userId: string,
  filters?: { status?: string; projectId?: string },
): Promise<Task[]> {
  const conditions = [eq(tasks.userId, userId)];

  if (filters?.status) {
    conditions.push(
      eq(
        tasks.status,
        filters.status as (typeof tasks.status.enumValues)[number],
      ),
    );
  }
  if (filters?.projectId) {
    conditions.push(eq(tasks.projectId, filters.projectId));
  }

  return db
    .select()
    .from(tasks)
    .where(and(...conditions))
    .orderBy(desc(tasks.createdAt));
}

export async function findUserTasksByTitleAndDate(
  userId: string,
): Promise<{ title: string; dueDate: Date | null }[]> {
  return db
    .select({ title: tasks.title, dueDate: tasks.dueDate })
    .from(tasks)
    .where(eq(tasks.userId, userId));
}

export async function bulkInsertTasks(data: NewTask[]): Promise<Task[]> {
  if (data.length === 0) return [];
  return db.insert(tasks).values(data).returning();
}

export async function softDeleteUser(
  userId: string,
): Promise<boolean> {
  // Mark profile as deleted by setting a deletion timestamp in name field
  const [updated] = await db
    .update(profiles)
    .set({
      name: `[DELETED_${new Date().toISOString()}]`,
      email: null,
      updatedAt: new Date(),
    })
    .where(eq(profiles.id, userId))
    .returning();

  return !!updated;
}

export async function findUserProfile(userId: string) {
  const [profile] = await db
    .select()
    .from(profiles)
    .where(eq(profiles.id, userId))
    .limit(1);

  return profile;
}
