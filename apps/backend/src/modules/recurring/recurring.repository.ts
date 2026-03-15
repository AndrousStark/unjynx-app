import { eq, and } from "drizzle-orm";
import { db } from "../../db/index.js";
import {
  recurringRules,
  type RecurringRule,
} from "../../db/schema/index.js";

export async function findByTaskId(
  taskId: string,
  userId: string,
): Promise<RecurringRule | undefined> {
  const [rule] = await db
    .select()
    .from(recurringRules)
    .where(
      and(
        eq(recurringRules.taskId, taskId),
        eq(recurringRules.userId, userId),
      ),
    );

  return rule;
}

export async function upsert(
  taskId: string,
  userId: string,
  rrule: string,
  nextOccurrence: Date | null,
): Promise<RecurringRule> {
  const existing = await findByTaskId(taskId, userId);

  if (existing) {
    const [updated] = await db
      .update(recurringRules)
      .set({
        rrule,
        nextOccurrence,
        updatedAt: new Date(),
      })
      .where(eq(recurringRules.id, existing.id))
      .returning();

    return updated;
  }

  const [created] = await db
    .insert(recurringRules)
    .values({
      taskId,
      userId,
      rrule,
      nextOccurrence,
    })
    .returning();

  return created;
}

export async function remove(
  taskId: string,
  userId: string,
): Promise<boolean> {
  const result = await db
    .delete(recurringRules)
    .where(
      and(
        eq(recurringRules.taskId, taskId),
        eq(recurringRules.userId, userId),
      ),
    )
    .returning({ id: recurringRules.id });

  return result.length > 0;
}
