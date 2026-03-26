import { eq, and, inArray } from "drizzle-orm";
import { db, contentDb } from "../../db/index.js";
import {
  profiles,
  subscriptions,
  notificationPreferences,
} from "../../db/schema/index.js";

// ── Broadcast Target Types ──────────────────────────────────────────

export interface BroadcastTarget {
  readonly id: string;
  readonly email: string | null;
}

export interface UserPrimaryChannel {
  readonly userId: string;
  readonly primaryChannel: string;
}

// ── Find Broadcast Targets ──────────────────────────────────────────

/**
 * Find all active (non-banned) user IDs matching the target plan filter.
 *
 * Uses `db` (primary) for profiles + subscriptions tables.
 *
 * @param targetPlan - "all" for all active users, or a specific plan name.
 */
export async function findBroadcastTargets(
  targetPlan: string,
): Promise<readonly BroadcastTarget[]> {
  if (targetPlan === "all") {
    // Get all active (non-banned) users
    return db
      .select({
        id: profiles.id,
        email: profiles.email,
      })
      .from(profiles)
      .where(eq(profiles.isBanned, false));
  }

  // Get users whose active subscription matches the target plan
  return db
    .select({
      id: profiles.id,
      email: profiles.email,
    })
    .from(profiles)
    .innerJoin(
      subscriptions,
      and(
        eq(subscriptions.userId, profiles.id),
        eq(subscriptions.status, "active"),
        eq(
          subscriptions.plan,
          targetPlan as (typeof subscriptions.plan.enumValues)[number],
        ),
      ),
    )
    .where(eq(profiles.isBanned, false));
}

// ── Find User Primary Channels ──────────────────────────────────────

/**
 * Look up the primary notification channel for a batch of user IDs.
 *
 * Uses `contentDb` for the notification_preferences table (on VPS/contentDb).
 * Processes in batches of 1000 to avoid overly large IN clauses.
 *
 * @param userIds - Array of profile IDs to look up.
 * @returns Array of { userId, primaryChannel } for users that have preferences set.
 */
export async function findUserPrimaryChannels(
  userIds: readonly string[],
): Promise<readonly UserPrimaryChannel[]> {
  if (userIds.length === 0) return [];

  const BATCH_SIZE = 1000;
  const results: UserPrimaryChannel[] = [];

  for (let i = 0; i < userIds.length; i += BATCH_SIZE) {
    const batch = userIds.slice(i, i + BATCH_SIZE);

    const rows = await contentDb
      .select({
        userId: notificationPreferences.userId,
        primaryChannel: notificationPreferences.primaryChannel,
      })
      .from(notificationPreferences)
      .where(inArray(notificationPreferences.userId, [...batch]));

    results.push(...rows);
  }

  return results;
}
