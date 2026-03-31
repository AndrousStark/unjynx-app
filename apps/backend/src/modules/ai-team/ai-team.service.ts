// ── AI Team Service ──────────────────────────────────────────────────
//
// AI-powered team productivity features:
//   1. Daily standup summary (auto-generated from yesterday's activity)
//   2. Sprint report (weekly velocity + burndown analysis)
//   3. Risk detection (blocked tasks, overdue, stale items)
//   4. Smart assignment (suggest who should work on a task)
//   5. Task decomposition (break Epic into Stories)
//   6. Project health scoring (green/yellow/red)
//
// All operations are logged to ai_operations for cost tracking.
// Suggestions are stored in ai_suggestions for user acceptance.

import { eq, and, desc, gte, lte, ne, sql } from "drizzle-orm";
import { db } from "../../db/index.js";
import {
  tasks,
  orgMemberships,
  aiOperations,
  aiSuggestions,
  profiles,
  organizations,
  type AiOperation,
  type AiSuggestion,
} from "../../db/schema/index.js";
import { logger } from "../../middleware/logger.js";

const log = logger.child({ module: "ai-team" });

// ── Helpers ──────────────────────────────────────────────────────────

async function recordOperation(
  orgId: string,
  userId: string | null,
  operationType: string,
  inputContext: Record<string, unknown>,
  output: Record<string, unknown> | null,
  modelUsed: string,
  tokensUsed: number,
  latencyMs: number,
  status: string = "completed",
  errorMessage?: string,
): Promise<AiOperation> {
  const [op] = await db
    .insert(aiOperations)
    .values({
      orgId,
      userId,
      operationType,
      inputContext,
      output,
      modelUsed,
      tokensUsed,
      latencyMs,
      status,
      errorMessage,
    })
    .returning();
  return op;
}

async function getOrgMode(orgId: string): Promise<string | null> {
  const [org] = await db
    .select({ industryMode: organizations.industryMode })
    .from(organizations)
    .where(eq(organizations.id, orgId))
    .limit(1);
  return org?.industryMode ?? null;
}

// ── 1. Daily Standup Summary ─────────────────────────────────────────

export interface StandupSummary {
  readonly date: string;
  readonly completedYesterday: readonly { title: string; assignee: string | null }[];
  readonly inProgressToday: readonly { title: string; assignee: string | null; dueDate: string | null }[];
  readonly blockers: readonly { title: string; assignee: string | null; reason: string }[];
  readonly aiSummary: string;
  readonly memberCount: number;
}

export async function generateStandupSummary(
  orgId: string,
): Promise<StandupSummary> {
  const startTime = Date.now();
  const now = new Date();
  const yesterday = new Date(now);
  yesterday.setDate(yesterday.getDate() - 1);
  yesterday.setHours(0, 0, 0, 0);

  const todayStart = new Date(now);
  todayStart.setHours(0, 0, 0, 0);

  // Completed yesterday
  const completed = await db
    .select({ title: tasks.title, assigneeId: tasks.assigneeId })
    .from(tasks)
    .where(
      and(
        eq(tasks.orgId, orgId),
        eq(tasks.status, "completed"),
        gte(tasks.completedAt, yesterday),
        lte(tasks.completedAt, todayStart),
      ),
    )
    .limit(20);

  // In progress today
  const inProgress = await db
    .select({ title: tasks.title, assigneeId: tasks.assigneeId, dueDate: tasks.dueDate })
    .from(tasks)
    .where(
      and(
        eq(tasks.orgId, orgId),
        eq(tasks.status, "in_progress"),
      ),
    )
    .limit(20);

  // Overdue / blocked (potential blockers)
  const overdue = await db
    .select({ title: tasks.title, assigneeId: tasks.assigneeId, dueDate: tasks.dueDate })
    .from(tasks)
    .where(
      and(
        eq(tasks.orgId, orgId),
        ne(tasks.status, "completed"),
        ne(tasks.status, "cancelled"),
        lte(tasks.dueDate, now),
      ),
    )
    .limit(10);

  // Member count
  const members = await db
    .select({ id: orgMemberships.id })
    .from(orgMemberships)
    .where(and(eq(orgMemberships.orgId, orgId), eq(orgMemberships.status, "active")));

  // Build AI summary text
  const mode = await getOrgMode(orgId);
  const aiSummary = buildStandupText(completed.length, inProgress.length, overdue.length, mode);

  const latencyMs = Date.now() - startTime;

  // Record operation
  await recordOperation(
    orgId, null, "standup_summary",
    { completedCount: completed.length, inProgressCount: inProgress.length, overdueCount: overdue.length },
    { summary: aiSummary },
    "system", 0, latencyMs,
  );

  return {
    date: now.toISOString().slice(0, 10),
    completedYesterday: completed.map((t) => ({ title: t.title, assignee: t.assigneeId })),
    inProgressToday: inProgress.map((t) => ({
      title: t.title,
      assignee: t.assigneeId,
      dueDate: t.dueDate?.toISOString() ?? null,
    })),
    blockers: overdue.map((t) => ({
      title: t.title,
      assignee: t.assigneeId,
      reason: `Overdue since ${t.dueDate?.toISOString().slice(0, 10) ?? "unknown"}`,
    })),
    aiSummary,
    memberCount: members.length,
  };
}

function buildStandupText(
  completed: number,
  inProgress: number,
  overdue: number,
  mode: string | null,
): string {
  const modeLabel = mode ? ` (${mode} mode)` : "";
  const parts: string[] = [];
  parts.push(`Daily Summary${modeLabel}:`);
  parts.push(`${completed} tasks completed yesterday.`);
  parts.push(`${inProgress} tasks in progress today.`);
  if (overdue > 0) {
    parts.push(`[ALERT] ${overdue} overdue tasks need attention.`);
  } else {
    parts.push("No overdue items. Team is on track.");
  }
  return parts.join(" ");
}

// ── 3. Risk Detection ────────────────────────────────────────────────

export interface RiskReport {
  readonly overdueTasks: readonly { id: string; title: string; assigneeId: string | null; dueDate: string }[];
  readonly staleTasks: readonly { id: string; title: string; daysSinceUpdate: number }[];
  readonly unassignedHighPriority: readonly { id: string; title: string; priority: string }[];
  readonly riskLevel: "low" | "medium" | "high" | "critical";
  readonly aiInsight: string;
}

export async function detectRisks(orgId: string): Promise<RiskReport> {
  const startTime = Date.now();
  const now = new Date();
  const sevenDaysAgo = new Date(now);
  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

  // Overdue tasks
  const overdueTasks = await db
    .select({ id: tasks.id, title: tasks.title, assigneeId: tasks.assigneeId, dueDate: tasks.dueDate })
    .from(tasks)
    .where(
      and(
        eq(tasks.orgId, orgId),
        ne(tasks.status, "completed"),
        ne(tasks.status, "cancelled"),
        lte(tasks.dueDate, now),
      ),
    )
    .orderBy(tasks.dueDate)
    .limit(20);

  // Stale tasks (not updated in 7+ days, still in progress)
  const staleTasks = await db
    .select({ id: tasks.id, title: tasks.title, updatedAt: tasks.updatedAt })
    .from(tasks)
    .where(
      and(
        eq(tasks.orgId, orgId),
        eq(tasks.status, "in_progress"),
        lte(tasks.updatedAt, sevenDaysAgo),
      ),
    )
    .limit(20);

  // Unassigned high-priority tasks
  const unassigned = await db
    .select({ id: tasks.id, title: tasks.title, priority: tasks.priority })
    .from(tasks)
    .where(
      and(
        eq(tasks.orgId, orgId),
        ne(tasks.status, "completed"),
        ne(tasks.status, "cancelled"),
        sql`${tasks.assigneeId} IS NULL`,
        sql`${tasks.priority} IN ('high', 'urgent')`,
      ),
    )
    .limit(20);

  // Calculate risk level
  const riskScore = overdueTasks.length * 3 + staleTasks.length * 2 + unassigned.length * 1;
  const riskLevel: RiskReport["riskLevel"] =
    riskScore >= 15 ? "critical" :
    riskScore >= 8 ? "high" :
    riskScore >= 3 ? "medium" : "low";

  const aiInsight = buildRiskInsight(overdueTasks.length, staleTasks.length, unassigned.length, riskLevel);

  const latencyMs = Date.now() - startTime;
  await recordOperation(
    orgId, null, "risk_detection",
    { overdueCount: overdueTasks.length, staleCount: staleTasks.length, unassignedCount: unassigned.length },
    { riskLevel, insight: aiInsight },
    "system", 0, latencyMs,
  );

  return {
    overdueTasks: overdueTasks.map((t) => ({
      id: t.id,
      title: t.title,
      assigneeId: t.assigneeId,
      dueDate: t.dueDate!.toISOString(),
    })),
    staleTasks: staleTasks.map((t) => ({
      id: t.id,
      title: t.title,
      daysSinceUpdate: Math.floor((now.getTime() - t.updatedAt.getTime()) / (1000 * 60 * 60 * 24)),
    })),
    unassignedHighPriority: unassigned.map((t) => ({
      id: t.id,
      title: t.title,
      priority: t.priority,
    })),
    riskLevel,
    aiInsight,
  };
}

function buildRiskInsight(
  overdue: number,
  stale: number,
  unassigned: number,
  level: string,
): string {
  if (level === "low") return "Project is healthy. No significant risks detected.";
  const parts: string[] = [`Risk level: ${level.toUpperCase()}.`];
  if (overdue > 0) parts.push(`${overdue} tasks are past their due date.`);
  if (stale > 0) parts.push(`${stale} tasks haven't been updated in 7+ days.`);
  if (unassigned > 0) parts.push(`${unassigned} high-priority tasks have no assignee.`);
  return parts.join(" ");
}

// ── 4. Smart Assignment ──────────────────────────────────────────────

export interface AssignmentSuggestion {
  readonly userId: string;
  readonly userName: string | null;
  readonly reason: string;
  readonly confidence: number;
  readonly currentTaskCount: number;
}

export async function suggestAssignee(
  orgId: string,
  taskTitle: string,
  taskPriority: string,
): Promise<readonly AssignmentSuggestion[]> {
  const startTime = Date.now();

  // Get all active org members
  const members = await db
    .select({
      userId: orgMemberships.userId,
      role: orgMemberships.role,
    })
    .from(orgMemberships)
    .where(
      and(
        eq(orgMemberships.orgId, orgId),
        eq(orgMemberships.status, "active"),
        ne(orgMemberships.role, "viewer"),
        ne(orgMemberships.role, "guest"),
      ),
    );

  if (members.length === 0) return [];

  // Get task counts per member (workload)
  const suggestions: AssignmentSuggestion[] = [];

  for (const member of members) {
    const [taskCount] = await db
      .select({ count: sql<number>`count(*)` })
      .from(tasks)
      .where(
        and(
          eq(tasks.orgId, orgId),
          eq(tasks.assigneeId, member.userId),
          ne(tasks.status, "completed"),
          ne(tasks.status, "cancelled"),
        ),
      );

    const [profile] = await db
      .select({ name: profiles.name })
      .from(profiles)
      .where(eq(profiles.id, member.userId))
      .limit(1);

    const count = Number(taskCount?.count ?? 0);

    // Simple scoring: fewer tasks = higher score, owners/admins get slight boost
    const workloadScore = Math.max(0, 10 - count);
    const roleBonus = member.role === "owner" || member.role === "admin" ? 1 : 0;
    const confidence = Math.min(0.95, (workloadScore + roleBonus) / 12);

    suggestions.push({
      userId: member.userId,
      userName: profile?.name ?? null,
      reason: count === 0
        ? "No current tasks — available for new work"
        : `Currently has ${count} active task${count !== 1 ? "s" : ""}`,
      confidence: Math.round(confidence * 100) / 100,
      currentTaskCount: count,
    });
  }

  // Sort by confidence descending (least busy first)
  suggestions.sort((a, b) => b.confidence - a.confidence);

  const latencyMs = Date.now() - startTime;
  await recordOperation(
    orgId, null, "smart_assignment",
    { taskTitle, taskPriority, memberCount: members.length },
    { topSuggestion: suggestions[0]?.userId ?? null },
    "system", 0, latencyMs,
  );

  // Store top suggestion
  if (suggestions.length > 0) {
    await db.insert(aiSuggestions).values({
      orgId,
      entityType: "task",
      entityId: suggestions[0].userId, // Will be updated when task is created
      suggestionType: "assignee",
      suggestion: {
        userId: suggestions[0].userId,
        userName: suggestions[0].userName,
        reason: suggestions[0].reason,
      },
      confidence: String(suggestions[0].confidence),
      expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000), // 24h expiry
    }).onConflictDoNothing();
  }

  return suggestions.slice(0, 5);
}

// ── 5. Project Health Scoring ────────────────────────────────────────

export interface ProjectHealth {
  readonly projectId: string;
  readonly health: "green" | "yellow" | "red";
  readonly score: number;
  readonly metrics: {
    readonly totalTasks: number;
    readonly completedTasks: number;
    readonly overdueTasks: number;
    readonly completionRate: number;
    readonly avgDaysToComplete: number | null;
  };
  readonly aiInsight: string;
}

export async function getProjectHealth(
  orgId: string,
  projectId: string,
): Promise<ProjectHealth> {
  const startTime = Date.now();

  const [totals] = await db
    .select({
      total: sql<number>`count(*)`,
      completed: sql<number>`count(*) filter (where ${tasks.status} = 'completed')`,
      overdue: sql<number>`count(*) filter (where ${tasks.dueDate} < now() and ${tasks.status} not in ('completed', 'cancelled'))`,
    })
    .from(tasks)
    .where(and(eq(tasks.orgId, orgId), eq(tasks.projectId, projectId)));

  const total = Number(totals?.total ?? 0);
  const completed = Number(totals?.completed ?? 0);
  const overdue = Number(totals?.overdue ?? 0);
  const completionRate = total > 0 ? Math.round((completed / total) * 100) : 0;

  // Average days to complete
  const [avgResult] = await db
    .select({
      avgDays: sql<number>`avg(extract(epoch from (${tasks.completedAt} - ${tasks.createdAt})) / 86400)`,
    })
    .from(tasks)
    .where(
      and(
        eq(tasks.orgId, orgId),
        eq(tasks.projectId, projectId),
        eq(tasks.status, "completed"),
        sql`${tasks.completedAt} IS NOT NULL`,
      ),
    );

  const avgDays = avgResult?.avgDays ? Math.round(Number(avgResult.avgDays) * 10) / 10 : null;

  // Health scoring
  const overdueRatio = total > 0 ? overdue / total : 0;
  const score = Math.max(0, 100 - (overdueRatio * 200) - (total === 0 ? 50 : 0) + completionRate * 0.5);
  const health: ProjectHealth["health"] =
    score >= 70 ? "green" : score >= 40 ? "yellow" : "red";

  const aiInsight =
    health === "green" ? "Project is on track. Good completion rate with minimal overdue tasks." :
    health === "yellow" ? `Attention needed: ${overdue} overdue tasks. Consider re-prioritizing or adding resources.` :
    `Project at risk: ${overdue} overdue tasks out of ${total} total. Immediate action required.`;

  const latencyMs = Date.now() - startTime;
  await recordOperation(
    orgId, null, "project_health",
    { projectId, total, completed, overdue },
    { health, score, insight: aiInsight },
    "system", 0, latencyMs,
  );

  return {
    projectId,
    health,
    score: Math.round(score),
    metrics: { totalTasks: total, completedTasks: completed, overdueTasks: overdue, completionRate, avgDaysToComplete: avgDays },
    aiInsight,
  };
}

// ── 6. Accept / Dismiss Suggestions ──────────────────────────────────

export async function acceptSuggestion(suggestionId: string): Promise<void> {
  await db
    .update(aiSuggestions)
    .set({ accepted: true })
    .where(eq(aiSuggestions.id, suggestionId));
}

export async function dismissSuggestion(suggestionId: string): Promise<void> {
  await db
    .update(aiSuggestions)
    .set({ accepted: false })
    .where(eq(aiSuggestions.id, suggestionId));
}

export async function getPendingSuggestions(
  orgId: string,
  entityType?: string,
  entityId?: string,
): Promise<readonly AiSuggestion[]> {
  const conditions = [
    eq(aiSuggestions.orgId, orgId),
    sql`${aiSuggestions.accepted} IS NULL`,
    sql`(${aiSuggestions.expiresAt} IS NULL OR ${aiSuggestions.expiresAt} > now())`,
  ];

  if (entityType) conditions.push(eq(aiSuggestions.entityType, entityType));
  if (entityId) conditions.push(eq(aiSuggestions.entityId, entityId));

  return db
    .select()
    .from(aiSuggestions)
    .where(and(...conditions))
    .orderBy(desc(aiSuggestions.createdAt))
    .limit(20);
}

// ── 7. AI Operations History ─────────────────────────────────────────

export async function getOperationHistory(
  orgId: string,
  options?: { operationType?: string; limit?: number },
): Promise<readonly AiOperation[]> {
  const conditions = [eq(aiOperations.orgId, orgId)];
  if (options?.operationType) {
    conditions.push(eq(aiOperations.operationType, options.operationType));
  }

  return db
    .select()
    .from(aiOperations)
    .where(and(...conditions))
    .orderBy(desc(aiOperations.createdAt))
    .limit(options?.limit ?? 20);
}

export async function getAiCostSummary(
  orgId: string,
): Promise<{ totalOperations: number; totalTokens: number; byType: Record<string, number> }> {
  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

  const rows = await db
    .select({
      operationType: aiOperations.operationType,
      count: sql<number>`count(*)`,
      tokens: sql<number>`coalesce(sum(${aiOperations.tokensUsed}), 0)`,
    })
    .from(aiOperations)
    .where(
      and(
        eq(aiOperations.orgId, orgId),
        gte(aiOperations.createdAt, thirtyDaysAgo),
      ),
    )
    .groupBy(aiOperations.operationType);

  const byType: Record<string, number> = {};
  let totalOperations = 0;
  let totalTokens = 0;

  for (const row of rows) {
    byType[row.operationType] = Number(row.count);
    totalOperations += Number(row.count);
    totalTokens += Number(row.tokens);
  }

  return { totalOperations, totalTokens, byType };
}
