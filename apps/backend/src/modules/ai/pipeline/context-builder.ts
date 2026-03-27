// ── Layer 4: Context Builder ─────────────────────────────────────────
//
// Builds compact user context (<50 tokens) for LLM requests.
// Fetches task stats, streak, energy level from DB.
//
// Inspired by BadhiyaAI's ultra-compact JSON context strategy.

import { eq, and, gte, sql } from "drizzle-orm";
import { db } from "../../../db/index.js";
import { tasks, profiles, progressSnapshots } from "../../../db/schema/index.js";

export interface UserContext {
  readonly name: string;
  readonly tasksToday: number;
  readonly completedToday: number;
  readonly totalPending: number;
  readonly streak: number;
  readonly topProject: string | null;
  readonly currentHour: number;
  readonly dayOfWeek: string;
  readonly plan: string;
}

const DAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"] as const;

/**
 * Build compact user context for LLM injection.
 * Total: ~40-50 tokens when serialized.
 */
export async function buildUserContext(
  profileId: string,
): Promise<UserContext> {
  const now = new Date();
  const todayStart = new Date(now);
  todayStart.setHours(0, 0, 0, 0);

  // Parallel DB queries for speed
  const [profile, todayTasks, pendingCount, recentProgress] = await Promise.all([
    // User profile
    db
      .select({ name: profiles.name, adminRole: profiles.adminRole })
      .from(profiles)
      .where(eq(profiles.id, profileId))
      .limit(1)
      .then((r) => r[0]),

    // Today's tasks
    db
      .select({
        total: sql<number>`count(*)`.as("total"),
        completed: sql<number>`count(*) filter (where ${tasks.status} = 'completed')`.as("completed"),
      })
      .from(tasks)
      .where(
        and(
          eq(tasks.userId, profileId),
          gte(tasks.createdAt, todayStart),
        ),
      )
      .then((r) => r[0] ?? { total: 0, completed: 0 }),

    // Total pending
    db
      .select({ count: sql<number>`count(*)`.as("count") })
      .from(tasks)
      .where(
        and(
          eq(tasks.userId, profileId),
          eq(tasks.status, "pending"),
        ),
      )
      .then((r) => r[0]?.count ?? 0),

    // Recent progress snapshots for streak calculation
    db
      .select({ tasksCompleted: progressSnapshots.tasksCompleted })
      .from(progressSnapshots)
      .where(eq(progressSnapshots.userId, profileId))
      .orderBy(sql`${progressSnapshots.snapshotDate} DESC`)
      .limit(7)
      .then((r) => r),
  ]);

  // Calculate streak from consecutive days with completions
  const streak = recentProgress.filter((s) => s.tasksCompleted > 0).length;

  return {
    name: profile?.name ?? "User",
    tasksToday: Number(todayTasks.total),
    completedToday: Number(todayTasks.completed),
    totalPending: Number(pendingCount),
    streak,
    topProject: null, // Could query most active project
    currentHour: now.getHours(),
    dayOfWeek: DAYS[now.getDay()],
    plan: "free", // Would come from subscription check
  };
}

/**
 * Serialize context to compact string for LLM system prompt injection.
 */
export function serializeContext(ctx: UserContext): string {
  return [
    `User: ${ctx.name}`,
    `Today: ${ctx.completedToday}/${ctx.tasksToday} tasks done`,
    `Pending: ${ctx.totalPending}`,
    `Streak: ${ctx.streak} days`,
    `Time: ${ctx.dayOfWeek} ${ctx.currentHour}:00`,
  ].join(". ");
}
