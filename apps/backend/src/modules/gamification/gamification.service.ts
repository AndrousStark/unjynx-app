import type { UserXp, Achievement, UserAchievement, Challenge } from "../../db/schema/index.js";
import type { AwardXpInput, LeaderboardQuery, CreateChallengeInput } from "./gamification.schema.js";
import { XP_PER_LEVEL } from "./gamification.constants.js";
import * as gamificationRepo from "./gamification.repository.js";

// ── XP ────────────────────────────────────────────────────────────────

export interface XpStatus {
  readonly totalXp: number;
  readonly level: number;
  readonly currentLevelXp: number;
  readonly xpToNextLevel: number;
  readonly progress: number;
}

export async function getXpStatus(userId: string): Promise<XpStatus> {
  const xp = await gamificationRepo.findUserXp(userId);

  if (!xp) {
    return {
      totalXp: 0,
      level: 1,
      currentLevelXp: 0,
      xpToNextLevel: XP_PER_LEVEL,
      progress: 0,
    };
  }

  const currentLevelXp = xp.totalXp % XP_PER_LEVEL;
  const xpToNextLevel = XP_PER_LEVEL - currentLevelXp;
  const progress = currentLevelXp / XP_PER_LEVEL;

  return {
    totalXp: xp.totalXp,
    level: xp.level,
    currentLevelXp,
    xpToNextLevel,
    progress,
  };
}

export async function awardXp(
  userId: string,
  input: AwardXpInput,
): Promise<XpStatus> {
  // Record the transaction
  await gamificationRepo.insertXpTransaction({
    userId,
    amount: input.amount,
    source: input.source,
    sourceId: input.sourceId,
    description: input.description,
  });

  // Update aggregated XP
  await gamificationRepo.upsertUserXp(userId, input.amount);

  return getXpStatus(userId);
}

// ── Achievements ──────────────────────────────────────────────────────

export interface AchievementWithStatus {
  readonly achievement: Achievement;
  readonly unlocked: boolean;
  readonly unlockedAt: Date | null;
}

export async function getAchievements(
  userId: string,
): Promise<AchievementWithStatus[]> {
  const [allAchievements, userUnlocked] = await Promise.all([
    gamificationRepo.findAllAchievements(),
    gamificationRepo.findUserAchievements(userId),
  ]);

  const unlockedMap = new Map<string, UserAchievement>();
  for (const ua of userUnlocked) {
    unlockedMap.set(ua.achievementId, ua);
  }

  return allAchievements.map((achievement) => {
    const ua = unlockedMap.get(achievement.id);
    return {
      achievement,
      unlocked: !!ua,
      unlockedAt: ua?.unlockedAt ?? null,
    };
  });
}

// ── Leaderboard ───────────────────────────────────────────────────────

export async function getLeaderboard(
  userId: string,
  query: LeaderboardQuery,
): Promise<gamificationRepo.LeaderboardEntry[]> {
  const now = new Date();
  const sinceDate =
    query.period === "week"
      ? new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)
      : new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

  if (query.scope === "team") {
    return gamificationRepo.getTeamLeaderboard(userId, sinceDate, query.limit);
  }

  return gamificationRepo.getFriendsLeaderboard(userId, sinceDate, query.limit);
}

// ── Challenges ────────────────────────────────────────────────────────

export async function createChallenge(
  userId: string,
  input: CreateChallengeInput,
): Promise<Challenge> {
  if (input.opponentId === userId) {
    throw new Error("Cannot challenge yourself");
  }

  if (input.endsAt <= input.startsAt) {
    throw new Error("End date must be after start date");
  }

  return gamificationRepo.insertChallenge({
    creatorId: userId,
    opponentId: input.opponentId,
    type: input.type,
    targetValue: input.targetValue,
    startsAt: input.startsAt,
    endsAt: input.endsAt,
    status: "pending",
  });
}

export async function getChallenges(
  userId: string,
  status?: string,
  limit?: number,
): Promise<Challenge[]> {
  return gamificationRepo.findChallenges(userId, status, limit);
}

export async function acceptChallenge(
  userId: string,
  challengeId: string,
): Promise<Challenge | undefined> {
  const challenge = await gamificationRepo.findChallengeById(challengeId);

  if (!challenge) return undefined;

  if (challenge.opponentId !== userId) {
    throw new Error("Only the opponent can accept this challenge");
  }

  if (challenge.status !== "pending") {
    throw new Error("Challenge is not in pending status");
  }

  return gamificationRepo.updateChallengeStatus(challengeId, "active");
}
