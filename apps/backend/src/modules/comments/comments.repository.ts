import { eq, and, count, desc } from "drizzle-orm";
import { db } from "../../db/index.js";
import {
  comments,
  type Comment,
  type NewComment,
} from "../../db/schema/index.js";

export async function insertComment(
  data: NewComment,
): Promise<Comment> {
  const [created] = await db
    .insert(comments)
    .values(data)
    .returning();

  return created;
}

export async function findCommentsByTaskId(
  taskId: string,
  limit: number,
  offset: number,
): Promise<{ items: Comment[]; total: number }> {
  const where = eq(comments.taskId, taskId);

  const [items, [{ total }]] = await Promise.all([
    db
      .select()
      .from(comments)
      .where(where)
      .orderBy(desc(comments.createdAt))
      .limit(limit)
      .offset(offset),
    db.select({ total: count() }).from(comments).where(where),
  ]);

  return { items, total };
}

export async function findCommentById(
  commentId: string,
): Promise<Comment | undefined> {
  const [comment] = await db
    .select()
    .from(comments)
    .where(eq(comments.id, commentId));

  return comment;
}

export async function updateCommentById(
  userId: string,
  commentId: string,
  data: Partial<Pick<NewComment, "content">> & { updatedAt: Date },
): Promise<Comment | undefined> {
  const [updated] = await db
    .update(comments)
    .set(data)
    .where(and(eq(comments.id, commentId), eq(comments.userId, userId)))
    .returning();

  return updated;
}

export async function deleteCommentById(
  userId: string,
  commentId: string,
): Promise<boolean> {
  const result = await db
    .delete(comments)
    .where(and(eq(comments.id, commentId), eq(comments.userId, userId)))
    .returning({ id: comments.id });

  return result.length > 0;
}
