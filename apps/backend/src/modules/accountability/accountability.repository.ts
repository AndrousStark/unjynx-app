import { eq, and, or, desc, gte } from "drizzle-orm";
import { db } from "../../db/index.js";
import {
  accountabilityPartners,
  nudges,
  sharedGoals,
  sharedGoalProgress,
  type AccountabilityPartner,
  type NewAccountabilityPartner,
  type Nudge,
  type NewNudge,
  type SharedGoal,
  type NewSharedGoal,
  type SharedGoalProgress,
  type NewSharedGoalProgress,
} from "../../db/schema/index.js";

// ── Partners ──────────────────────────────────────────────────────────

export async function findPartners(
  userId: string,
): Promise<AccountabilityPartner[]> {
  return db
    .select()
    .from(accountabilityPartners)
    .where(
      or(
        eq(accountabilityPartners.userId, userId),
        eq(accountabilityPartners.partnerId, userId),
      ),
    )
    .orderBy(desc(accountabilityPartners.createdAt));
}

export async function findPartnerById(
  id: string,
): Promise<AccountabilityPartner | undefined> {
  const [partner] = await db
    .select()
    .from(accountabilityPartners)
    .where(eq(accountabilityPartners.id, id))
    .limit(1);

  return partner;
}

export async function findPartnerByInviteCode(
  code: string,
): Promise<AccountabilityPartner | undefined> {
  const [partner] = await db
    .select()
    .from(accountabilityPartners)
    .where(eq(accountabilityPartners.inviteCode, code))
    .limit(1);

  return partner;
}

export async function insertPartner(
  data: NewAccountabilityPartner,
): Promise<AccountabilityPartner> {
  const [created] = await db
    .insert(accountabilityPartners)
    .values(data)
    .returning();

  return created;
}

export async function updatePartnerStatus(
  id: string,
  status: "pending" | "active" | "declined",
): Promise<AccountabilityPartner | undefined> {
  const [updated] = await db
    .update(accountabilityPartners)
    .set({ status, updatedAt: new Date() })
    .where(eq(accountabilityPartners.id, id))
    .returning();

  return updated;
}

export async function deletePartner(
  id: string,
  userId: string,
): Promise<boolean> {
  const result = await db
    .delete(accountabilityPartners)
    .where(
      and(
        eq(accountabilityPartners.id, id),
        or(
          eq(accountabilityPartners.userId, userId),
          eq(accountabilityPartners.partnerId, userId),
        ),
      ),
    )
    .returning({ id: accountabilityPartners.id });

  return result.length > 0;
}

// ── Nudges ────────────────────────────────────────────────────────────

export async function insertNudge(data: NewNudge): Promise<Nudge> {
  const [created] = await db
    .insert(nudges)
    .values(data)
    .returning();

  return created;
}

export async function findNudgesSentToday(
  senderId: string,
  receiverId: string,
): Promise<Nudge[]> {
  const startOfDay = new Date();
  startOfDay.setHours(0, 0, 0, 0);

  return db
    .select()
    .from(nudges)
    .where(
      and(
        eq(nudges.senderId, senderId),
        eq(nudges.receiverId, receiverId),
        gte(nudges.sentAt, startOfDay),
      ),
    );
}

// ── Shared Goals ──────────────────────────────────────────────────────

export async function insertSharedGoal(
  data: NewSharedGoal,
): Promise<SharedGoal> {
  const [created] = await db
    .insert(sharedGoals)
    .values(data)
    .returning();

  return created;
}

export async function findSharedGoalById(
  id: string,
): Promise<SharedGoal | undefined> {
  const [goal] = await db
    .select()
    .from(sharedGoals)
    .where(eq(sharedGoals.id, id))
    .limit(1);

  return goal;
}

export async function insertGoalProgress(
  data: NewSharedGoalProgress,
): Promise<SharedGoalProgress> {
  const [created] = await db
    .insert(sharedGoalProgress)
    .values(data)
    .returning();

  return created;
}

export async function findGoalProgress(
  goalId: string,
): Promise<SharedGoalProgress[]> {
  return db
    .select()
    .from(sharedGoalProgress)
    .where(eq(sharedGoalProgress.goalId, goalId));
}
