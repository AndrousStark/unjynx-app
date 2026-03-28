// ── Layer 4: Context Builder (v2 — dynamic selection + time-aware) ──
//
// Builds compact user context (<100 tokens) for LLM requests.
// Fetches task stats, streak, energy level from DB.
//
// v2 upgrades:
//   - Dynamic context selection based on query intent
//   - Time-of-day awareness (peak hours, energy state)
//   - Overdue task highlighting
//   - Recent activity tracking
//   - Token budget management (~80-100 tokens total)

import { eq, and, gte, lte, ne, desc, sql } from "drizzle-orm";
import { db } from "../../../db/index.js";
import { tasks, profiles, progressSnapshots } from "../../../db/schema/index.js";

// ── Types ──────────────────────────────────────────────────────────

export interface TopTask {
  readonly title: string;
  readonly priority: string;
  readonly dueDate: Date | null;
}

export interface UserContext {
  readonly name: string;
  readonly tasksToday: number;
  readonly completedToday: number;
  readonly totalPending: number;
  readonly overdueCount: number;
  readonly streak: number;
  readonly topTasks: readonly TopTask[];
  readonly topProject: string | null;
  readonly currentHour: number;
  readonly dayOfWeek: string;
  readonly plan: string;
  readonly energyState: "peak" | "moderate" | "low";
  readonly timeAdvice: string;
}

const DAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"] as const;

// ── Energy State Estimation ───────────────────────────────────────
// Based on circadian rhythm research (Kleitman 1950s, Mark 2008)
// Peak: 9-12 AM, 3-5 PM | Low: 12-2 PM, after 8 PM

function estimateEnergyState(hour: number): "peak" | "moderate" | "low" {
  if ((hour >= 9 && hour < 12) || (hour >= 15 && hour < 17)) return "peak";
  if ((hour >= 12 && hour < 14) || hour >= 20 || hour < 7) return "low";
  return "moderate";
}

function getTimeAdvice(hour: number): string {
  if (hour >= 6 && hour < 9) return "Morning planning window — review & prioritize.";
  if (hour >= 9 && hour < 12) return "Peak focus — tackle complex/creative tasks.";
  if (hour >= 12 && hour < 14) return "Post-lunch dip — do quick, easy wins.";
  if (hour >= 14 && hour < 17) return "Afternoon momentum — collaborative work.";
  if (hour >= 17 && hour < 20) return "Wind down — close open loops, plan tomorrow.";
  if (hour >= 20) return "Evening — rest is productive too.";
  return "Early hours — deep work if you're a night owl.";
}

// ── Public API ──────────────────────────────────────────────────────

/**
 * Build compact user context for LLM injection.
 * Total: ~80-100 tokens when serialized.
 */
export async function buildUserContext(
  profileId: string,
): Promise<UserContext> {
  const now = new Date();
  const todayStart = new Date(now);
  todayStart.setHours(0, 0, 0, 0);
  const todayEnd = new Date(now);
  todayEnd.setHours(23, 59, 59, 999);

  // Parallel DB queries for speed
  const [profile, todayStats, pendingCount, overdueCount, recentProgress, topTaskRows] = await Promise.all([
    // User profile
    db
      .select({ name: profiles.name, adminRole: profiles.adminRole })
      .from(profiles)
      .where(eq(profiles.id, profileId))
      .limit(1)
      .then((r) => r[0]),

    // Today's tasks stats
    db
      .select({
        total: sql<number>`count(*)`.as("total"),
        completed: sql<number>`count(*) filter (where ${tasks.status} = 'completed')`.as("completed"),
      })
      .from(tasks)
      .where(
        and(
          eq(tasks.userId, profileId),
          gte(tasks.dueDate, todayStart),
          lte(tasks.dueDate, todayEnd),
        ),
      )
      .then((r) => r[0] ?? { total: 0, completed: 0 }),

    // Total pending tasks
    db
      .select({ count: sql<number>`count(*)`.as("count") })
      .from(tasks)
      .where(
        and(
          eq(tasks.userId, profileId),
          ne(tasks.status, "completed" as never),
          ne(tasks.status, "cancelled" as never),
        ),
      )
      .then((r) => r[0]?.count ?? 0),

    // Overdue count
    db
      .select({ count: sql<number>`count(*)`.as("count") })
      .from(tasks)
      .where(
        and(
          eq(tasks.userId, profileId),
          ne(tasks.status, "completed" as never),
          ne(tasks.status, "cancelled" as never),
          lte(tasks.dueDate, now),
        ),
      )
      .then((r) => r[0]?.count ?? 0),

    // Recent progress for streak
    db
      .select({ tasksCompleted: progressSnapshots.tasksCompleted })
      .from(progressSnapshots)
      .where(eq(progressSnapshots.userId, profileId))
      .orderBy(desc(progressSnapshots.snapshotDate))
      .limit(30)
      .then((r) => r),

    // Top 3 pending tasks by priority + deadline proximity
    db
      .select({
        title: tasks.title,
        priority: tasks.priority,
        dueDate: tasks.dueDate,
      })
      .from(tasks)
      .where(
        and(
          eq(tasks.userId, profileId),
          ne(tasks.status, "completed" as never),
          ne(tasks.status, "cancelled" as never),
        ),
      )
      .orderBy(
        sql`CASE ${tasks.priority}
          WHEN 'urgent' THEN 1 WHEN 'high' THEN 2
          WHEN 'medium' THEN 3 WHEN 'low' THEN 4 ELSE 5 END`,
        tasks.dueDate,
      )
      .limit(3)
      .then((r) => r),
  ]);

  // Calculate streak — consecutive days with completions
  let streak = 0;
  for (const snap of recentProgress) {
    if (snap.tasksCompleted > 0) streak++;
    else break;
  }

  const hour = now.getHours();

  return {
    name: profile?.name ?? "User",
    tasksToday: Number(todayStats.total),
    completedToday: Number(todayStats.completed),
    totalPending: Number(pendingCount),
    overdueCount: Number(overdueCount),
    streak,
    topTasks: topTaskRows.map((t) => ({
      title: t.title,
      priority: t.priority,
      dueDate: t.dueDate,
    })),
    topProject: null,
    currentHour: hour,
    dayOfWeek: DAYS[now.getDay()],
    plan: "free",
    energyState: estimateEnergyState(hour),
    timeAdvice: getTimeAdvice(hour),
  };
}

/**
 * Serialize context to compact string for LLM system prompt injection.
 * Target: <100 tokens total.
 */
export function serializeContext(ctx: UserContext): string {
  const lines: string[] = [
    `User: ${ctx.name}`,
    `Time: ${ctx.dayOfWeek} ${ctx.currentHour}:00 (energy: ${ctx.energyState})`,
    `Today: ${ctx.completedToday}/${ctx.tasksToday} done`,
    `Pending: ${ctx.totalPending}`,
  ];

  if (ctx.overdueCount > 0) {
    lines.push(`Overdue: ${ctx.overdueCount} (needs attention)`);
  }

  if (ctx.streak > 0) {
    lines.push(`Streak: ${ctx.streak}d`);
  }

  if (ctx.topTasks.length > 0) {
    const taskList = ctx.topTasks.map((t) => {
      const p = t.priority !== "none" ? `[${t.priority}]` : "";
      const d = t.dueDate ? ` due ${new Date(t.dueDate).toLocaleDateString("en-US", { month: "short", day: "numeric" })}` : "";
      return `${p}${t.title}${d}`;
    }).join("; ");
    lines.push(`Top tasks: ${taskList}`);
  }

  lines.push(`Advice: ${ctx.timeAdvice}`);

  return lines.join(". ");
}

/**
 * Build intent-specific context (dynamic selection).
 * Only includes data relevant to the query type.
 */
export function serializeContextForIntent(
  ctx: UserContext,
  intent: string | null,
): string {
  const base = `User: ${ctx.name}. ${ctx.dayOfWeek} ${ctx.currentHour}:00 (${ctx.energyState} energy).`;

  switch (intent) {
    case "ai_schedule":
    case "show_schedule":
      return `${base} Today: ${ctx.completedToday}/${ctx.tasksToday} done. Pending: ${ctx.totalPending}. Overdue: ${ctx.overdueCount}. ${ctx.timeAdvice}`;

    case "show_progress":
    case "show_insights":
      return `${base} Today: ${ctx.completedToday}/${ctx.tasksToday}. Pending: ${ctx.totalPending}. Streak: ${ctx.streak}d. Overdue: ${ctx.overdueCount}.`;

    case "create_task":
    case "decompose_task":
      return `${base} Pending: ${ctx.totalPending}. Energy: ${ctx.energyState}. ${ctx.timeAdvice}`;

    case "greeting":
      return `${base} Today: ${ctx.completedToday}/${ctx.tasksToday} done. Streak: ${ctx.streak}d. ${ctx.timeAdvice}`;

    default:
      return serializeContext(ctx);
  }
}
