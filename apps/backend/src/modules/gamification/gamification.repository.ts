import { eq, and, desc, sql, gte, or, inArray } from "drizzle-orm";
import { db } from "../../db/index.js";
import {
  userXp,
  xpTransactions,
  achievements,
  userAchievements,
  challenges,
  accountabilityPartners,
  teamMembers,
  type UserXp,
  type NewUserXp,
  type XpTransaction,
  type NewXpTransaction,
  type Achievement,
  type UserAchievement,
  type Challenge,
  type NewChallenge,
} from "../../db/schema/index.js";

// ── User XP ───────────────────────────────────────────────────────────

export async function findUserXp(userId: string): Promise<UserXp | undefined> {
  const [xp] = await db
    .select()
    .from(userXp)
    .where(eq(userXp.userId, userId))
    .limit(1);

  return xp;
}

export async function upsertUserXp(
  userId: string,
  xpAmount: number,
): Promise<UserXp> {
  const existing = await findUserXp(userId);

  if (!existing) {
    const [created] = await db
      .insert(userXp)
      .values({
        userId,
        totalXp: xpAmount,
        level: 1,
        lastXpEarnedAt: new Date(),
      })
      .returning();
    return created;
  }

  const newTotal = existing.totalXp + xpAmount;
  const newLevel = Math.floor(newTotal / 500) + 1;

  const [updated] = await db
    .update(userXp)
    .set({
      totalXp: newTotal,
      level: newLevel,
      lastXpEarnedAt: new Date(),
      updatedAt: new Date(),
    })
    .where(eq(userXp.userId, userId))
    .returning();

  return updated;
}

// ── XP Transactions ───────────────────────────────────────────────────

export async function insertXpTransaction(
  data: NewXpTransaction,
): Promise<XpTransaction> {
  const [created] = await db
    .insert(xpTransactions)
    .values(data)
    .returning();

  return created;
}

// ── Achievements ──────────────────────────────────────────────────────

export async function findAllAchievements(): Promise<Achievement[]> {
  return db.select().from(achievements).orderBy(achievements.key);
}

export async function findUserAchievements(
  userId: string,
): Promise<UserAchievement[]> {
  return db
    .select()
    .from(userAchievements)
    .where(eq(userAchievements.userId, userId))
    .orderBy(desc(userAchievements.unlockedAt));
}

export async function hasAchievement(
  userId: string,
  achievementId: string,
): Promise<boolean> {
  const [ua] = await db
    .select({ id: userAchievements.id })
    .from(userAchievements)
    .where(
      and(
        eq(userAchievements.userId, userId),
        eq(userAchievements.achievementId, achievementId),
      ),
    )
    .limit(1);

  return !!ua;
}

export async function unlockAchievement(
  userId: string,
  achievementId: string,
): Promise<UserAchievement> {
  const [created] = await db
    .insert(userAchievements)
    .values({ userId, achievementId })
    .returning();

  return created;
}

// ── Leaderboard ───────────────────────────────────────────────────────

export interface LeaderboardEntry {
  readonly userId: string;
  readonly totalXp: number;
  readonly level: number;
}

export async function getFriendsLeaderboard(
  userId: string,
  sinceDate: Date,
  limit: number,
): Promise<LeaderboardEntry[]> {
  // Get partner user IDs
  const partners = await db
    .select({ partnerId: accountabilityPartners.partnerId })
    .from(accountabilityPartners)
    .where(
      and(
        eq(accountabilityPartners.userId, userId),
        eq(accountabilityPartners.status, "active"),
      ),
    );

  const partnerIds = partners.map((p) => p.partnerId);
  const allUserIds = [userId, ...partnerIds];

  if (allUserIds.length === 0) return [];

  const results = await db
    .select({
      userId: xpTransactions.userId,
      totalXp: sql<number>`COALESCE(SUM(${xpTransactions.amount}), 0)::int`,
    })
    .from(xpTransactions)
    .where(
      and(
        inArray(xpTransactions.userId, allUserIds),
        gte(xpTransactions.createdAt, sinceDate),
      ),
    )
    .groupBy(xpTransactions.userId)
    .orderBy(sql`SUM(${xpTransactions.amount}) DESC`)
    .limit(limit);

  return results.map((r) => ({
    userId: r.userId,
    totalXp: r.totalXp,
    level: Math.floor(r.totalXp / 500) + 1,
  }));
}

export async function getTeamLeaderboard(
  userId: string,
  sinceDate: Date,
  limit: number,
): Promise<LeaderboardEntry[]> {
  // Get team member user IDs from user's teams
  const members = await db
    .select({ userId: teamMembers.userId })
    .from(teamMembers)
    .where(
      inArray(
        teamMembers.teamId,
        db
          .select({ teamId: teamMembers.teamId })
          .from(teamMembers)
          .where(eq(teamMembers.userId, userId)),
      ),
    );

  const memberIds = members.map((m) => m.userId);
  if (memberIds.length === 0) return [];

  const results = await db
    .select({
      userId: xpTransactions.userId,
      totalXp: sql<number>`COALESCE(SUM(${xpTransactions.amount}), 0)::int`,
    })
    .from(xpTransactions)
    .where(
      and(
        inArray(xpTransactions.userId, memberIds),
        gte(xpTransactions.createdAt, sinceDate),
      ),
    )
    .groupBy(xpTransactions.userId)
    .orderBy(sql`SUM(${xpTransactions.amount}) DESC`)
    .limit(limit);

  return results.map((r) => ({
    userId: r.userId,
    totalXp: r.totalXp,
    level: Math.floor(r.totalXp / 500) + 1,
  }));
}

// ── Challenges ────────────────────────────────────────────────────────

export async function insertChallenge(
  data: NewChallenge,
): Promise<Challenge> {
  const [created] = await db
    .insert(challenges)
    .values(data)
    .returning();

  return created;
}

export async function findChallenges(
  userId: string,
  status?: string,
  limit: number = 20,
): Promise<Challenge[]> {
  const baseCondition = or(
    eq(challenges.creatorId, userId),
    eq(challenges.opponentId, userId),
  );

  const conditions = status
    ? and(baseCondition, eq(challenges.status, status as "pending" | "active" | "completed" | "expired"))
    : baseCondition;

  return db
    .select()
    .from(challenges)
    .where(conditions)
    .orderBy(desc(challenges.createdAt))
    .limit(limit);
}

export async function findChallengeById(
  challengeId: string,
): Promise<Challenge | undefined> {
  const [challenge] = await db
    .select()
    .from(challenges)
    .where(eq(challenges.id, challengeId))
    .limit(1);

  return challenge;
}

export async function updateChallengeStatus(
  challengeId: string,
  status: "pending" | "active" | "completed" | "expired",
): Promise<Challenge | undefined> {
  const [updated] = await db
    .update(challenges)
    .set({ status })
    .where(eq(challenges.id, challengeId))
    .returning();

  return updated;
}
