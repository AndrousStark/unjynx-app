import { eq, and, count, asc } from "drizzle-orm";
import { db } from "../../db/index.js";
import {
  tags,
  taskTags,
  type Tag,
  type NewTag,
  type TaskTag,
} from "../../db/schema/index.js";

export async function insertTag(data: NewTag): Promise<Tag> {
  const [created] = await db.insert(tags).values(data).returning();
  return created;
}

export async function findTags(
  userId: string,
  limit: number,
  offset: number,
): Promise<{ items: Tag[]; total: number }> {
  const where = eq(tags.userId, userId);

  const [items, [{ total }]] = await Promise.all([
    db
      .select()
      .from(tags)
      .where(where)
      .orderBy(asc(tags.name))
      .limit(limit)
      .offset(offset),
    db.select({ total: count() }).from(tags).where(where),
  ]);

  return { items, total };
}

export async function findTagById(
  userId: string,
  tagId: string,
): Promise<Tag | undefined> {
  const [tag] = await db
    .select()
    .from(tags)
    .where(and(eq(tags.id, tagId), eq(tags.userId, userId)));

  return tag;
}

export async function findTagByName(
  userId: string,
  name: string,
): Promise<Tag | undefined> {
  const [tag] = await db
    .select()
    .from(tags)
    .where(and(eq(tags.userId, userId), eq(tags.name, name)));

  return tag;
}

export async function updateTagById(
  userId: string,
  tagId: string,
  data: Partial<NewTag>,
): Promise<Tag | undefined> {
  const [updated] = await db
    .update(tags)
    .set(data)
    .where(and(eq(tags.id, tagId), eq(tags.userId, userId)))
    .returning();

  return updated;
}

export async function deleteTagById(
  userId: string,
  tagId: string,
): Promise<boolean> {
  const result = await db
    .delete(tags)
    .where(and(eq(tags.id, tagId), eq(tags.userId, userId)))
    .returning({ id: tags.id });

  return result.length > 0;
}

export async function addTagToTask(
  taskId: string,
  tagId: string,
): Promise<TaskTag> {
  const [created] = await db
    .insert(taskTags)
    .values({ taskId, tagId })
    .returning();
  return created;
}

export async function removeTagFromTask(
  taskId: string,
  tagId: string,
): Promise<boolean> {
  const result = await db
    .delete(taskTags)
    .where(and(eq(taskTags.taskId, taskId), eq(taskTags.tagId, tagId)))
    .returning({ taskId: taskTags.taskId });

  return result.length > 0;
}

export async function findTagsByTaskId(taskId: string): Promise<Tag[]> {
  const rows = await db
    .select({
      id: tags.id,
      userId: tags.userId,
      name: tags.name,
      color: tags.color,
      createdAt: tags.createdAt,
    })
    .from(taskTags)
    .innerJoin(tags, eq(taskTags.tagId, tags.id))
    .where(eq(taskTags.taskId, taskId))
    .orderBy(asc(tags.name));

  return rows;
}

export async function findTaskIdsByTagId(
  tagId: string,
  limit: number,
  offset: number,
): Promise<{ taskIds: string[]; total: number }> {
  const where = eq(taskTags.tagId, tagId);

  const [rows, [{ total }]] = await Promise.all([
    db
      .select({ taskId: taskTags.taskId })
      .from(taskTags)
      .where(where)
      .limit(limit)
      .offset(offset),
    db.select({ total: count() }).from(taskTags).where(where),
  ]);

  return { taskIds: rows.map((r) => r.taskId), total };
}
