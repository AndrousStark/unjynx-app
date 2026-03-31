// ── Reports Service ──────────────────────────────────────────────────
//
// Analytics and reporting for org/project dashboards:
//   1. Sprint velocity (committed vs completed per sprint)
//   2. Cycle time (creation → completion duration)
//   3. Team workload (tasks per member)
//   4. SLA compliance (% within response/resolution targets)
//   5. Org summary (top-level KPIs)
//   6. Snapshot persistence for historical data

import { eq, and, desc, gte, lte, ne, sql } from "drizzle-orm";
import { db } from "../../db/index.js";
import {
  tasks,
  sprints,
  orgMemberships,
  profiles,
  reportSnapshots,
  slaPolicies,
  type ReportSnapshot,
} from "../../db/schema/index.js";
import { logger } from "../../middleware/logger.js";

const log = logger.child({ module: "reports" });

// ── 1. Sprint Velocity ───────────────────────────────────────────────

export interface VelocityData {
  readonly sprints: readonly {
    name: string;
    committed: number;
    completed: number;
    startDate: string | null;
    endDate: string | null;
  }[];
  readonly averageVelocity: number;
}

export async function getSprintVelocity(
  orgId: string,
  projectId: string,
  limit: number = 10,
): Promise<VelocityData> {
  const completedSprints = await db
    .select({
      name: sprints.name,
      committed: sprints.committedPoints,
      completed: sprints.completedPoints,
      startDate: sprints.startDate,
      endDate: sprints.endDate,
    })
    .from(sprints)
    .where(
      and(
        eq(sprints.orgId, orgId),
        eq(sprints.projectId, projectId),
        eq(sprints.status, "completed"),
      ),
    )
    .orderBy(desc(sprints.updatedAt))
    .limit(limit);

  const totalCompleted = completedSprints.reduce((s, r) => s + r.completed, 0);
  const averageVelocity = completedSprints.length > 0
    ? Math.round(totalCompleted / completedSprints.length)
    : 0;

  return {
    sprints: completedSprints.map((s) => ({
      name: s.name,
      committed: s.committed,
      completed: s.completed,
      startDate: s.startDate?.toISOString() ?? null,
      endDate: s.endDate?.toISOString() ?? null,
    })),
    averageVelocity,
  };
}

// ── 2. Cycle Time ────────────────────────────────────────────────────

export interface CycleTimeData {
  readonly averageDays: number | null;
  readonly medianDays: number | null;
  readonly distribution: readonly { range: string; count: number }[];
  readonly byPriority: readonly { priority: string; avgDays: number }[];
}

export async function getCycleTime(
  orgId: string,
  projectId?: string,
  days: number = 30,
): Promise<CycleTimeData> {
  const since = new Date();
  since.setDate(since.getDate() - days);

  const conditions = [
    eq(tasks.orgId, orgId),
    eq(tasks.status, "completed"),
    sql`${tasks.completedAt} IS NOT NULL`,
    gte(tasks.completedAt, since),
  ];

  if (projectId) conditions.push(eq(tasks.projectId, projectId));

  // Get all completed task durations
  const rows = await db
    .select({
      priority: tasks.priority,
      durationDays: sql<number>`extract(epoch from (${tasks.completedAt} - ${tasks.createdAt})) / 86400`,
    })
    .from(tasks)
    .where(and(...conditions));

  if (rows.length === 0) {
    return { averageDays: null, medianDays: null, distribution: [], byPriority: [] };
  }

  const durations = rows.map((r) => Number(r.durationDays)).sort((a, b) => a - b);
  const avg = Math.round((durations.reduce((s, d) => s + d, 0) / durations.length) * 10) / 10;
  const median = Math.round(durations[Math.floor(durations.length / 2)] * 10) / 10;

  // Distribution buckets
  const buckets = [
    { range: "< 1 day", max: 1 },
    { range: "1-3 days", max: 3 },
    { range: "3-7 days", max: 7 },
    { range: "1-2 weeks", max: 14 },
    { range: "2-4 weeks", max: 28 },
    { range: "> 4 weeks", max: Infinity },
  ];

  const distribution = buckets.map((b) => ({
    range: b.range,
    count: durations.filter((d) =>
      d < b.max && (b.max === 1 ? true : d >= (buckets[buckets.indexOf(b) - 1]?.max ?? 0)),
    ).length,
  }));

  // By priority
  const priorityMap = new Map<string, number[]>();
  for (const row of rows) {
    const list = priorityMap.get(row.priority) ?? [];
    list.push(Number(row.durationDays));
    priorityMap.set(row.priority, list);
  }

  const byPriority = Array.from(priorityMap.entries()).map(([priority, vals]) => ({
    priority,
    avgDays: Math.round((vals.reduce((s, v) => s + v, 0) / vals.length) * 10) / 10,
  }));

  return { averageDays: avg, medianDays: median, distribution, byPriority };
}

// ── 3. Team Workload ─────────────────────────────────────────────────

export interface WorkloadData {
  readonly members: readonly {
    userId: string;
    name: string | null;
    activeTasks: number;
    completedThisPeriod: number;
    overdueCount: number;
    estimatedHours: number;
  }[];
}

export async function getTeamWorkload(
  orgId: string,
  projectId?: string,
): Promise<WorkloadData> {
  const now = new Date();
  const weekAgo = new Date(now);
  weekAgo.setDate(weekAgo.getDate() - 7);

  // Get active members
  const members = await db
    .select({
      userId: orgMemberships.userId,
    })
    .from(orgMemberships)
    .where(
      and(
        eq(orgMemberships.orgId, orgId),
        eq(orgMemberships.status, "active"),
      ),
    );

  const memberData = await Promise.all(
    members.map(async (m) => {
      const baseConditions = [
        eq(tasks.orgId, orgId),
        eq(tasks.assigneeId, m.userId),
      ];
      if (projectId) baseConditions.push(eq(tasks.projectId, projectId));

      // Active tasks
      const [activeResult] = await db
        .select({ count: sql<number>`count(*)` })
        .from(tasks)
        .where(and(...baseConditions, ne(tasks.status, "completed"), ne(tasks.status, "cancelled")));

      // Completed this week
      const [completedResult] = await db
        .select({ count: sql<number>`count(*)` })
        .from(tasks)
        .where(and(...baseConditions, eq(tasks.status, "completed"), gte(tasks.completedAt, weekAgo)));

      // Overdue
      const [overdueResult] = await db
        .select({ count: sql<number>`count(*)` })
        .from(tasks)
        .where(and(
          ...baseConditions,
          ne(tasks.status, "completed"),
          ne(tasks.status, "cancelled"),
          lte(tasks.dueDate, now),
        ));

      // Estimated hours
      const [hoursResult] = await db
        .select({ total: sql<number>`coalesce(sum(${tasks.estimateHours}::numeric), 0)` })
        .from(tasks)
        .where(and(...baseConditions, ne(tasks.status, "completed"), ne(tasks.status, "cancelled")));

      // Get profile name
      const [profile] = await db
        .select({ name: profiles.name })
        .from(profiles)
        .where(eq(profiles.id, m.userId))
        .limit(1);

      return {
        userId: m.userId,
        name: profile?.name ?? null,
        activeTasks: Number(activeResult?.count ?? 0),
        completedThisPeriod: Number(completedResult?.count ?? 0),
        overdueCount: Number(overdueResult?.count ?? 0),
        estimatedHours: Number(hoursResult?.total ?? 0),
      };
    }),
  );

  return { members: memberData };
}

// ── 4. SLA Compliance ────────────────────────────────────────────────

export interface SlaComplianceData {
  readonly policies: readonly {
    policyName: string;
    totalTasks: number;
    withinSla: number;
    breached: number;
    complianceRate: number;
  }[];
  readonly overallComplianceRate: number;
}

export async function getSlaCompliance(
  orgId: string,
  projectId?: string,
  days: number = 30,
): Promise<SlaComplianceData> {
  const since = new Date();
  since.setDate(since.getDate() - days);

  // Get active SLA policies
  const policies = await db
    .select()
    .from(slaPolicies)
    .where(and(eq(slaPolicies.orgId, orgId), eq(slaPolicies.isActive, true)));

  if (policies.length === 0) {
    return { policies: [], overallComplianceRate: 100 };
  }

  // For each policy, check compliance
  const policyData = await Promise.all(
    policies
      .filter((p) => !projectId || p.projectId === projectId || p.projectId === null)
      .map(async (policy) => {
        const taskConditions = [
          eq(tasks.orgId, orgId),
          eq(tasks.status, "completed"),
          gte(tasks.completedAt, since),
        ];

        if (policy.projectId) taskConditions.push(eq(tasks.projectId, policy.projectId));

        const completedTasks = await db
          .select({
            id: tasks.id,
            createdAt: tasks.createdAt,
            completedAt: tasks.completedAt,
          })
          .from(tasks)
          .where(and(...taskConditions))
          .limit(500);

        let withinSla = 0;
        let breached = 0;

        for (const task of completedTasks) {
          if (!task.completedAt) continue;

          const durationMinutes = (task.completedAt.getTime() - task.createdAt.getTime()) / (1000 * 60);

          if (policy.resolutionTimeMinutes && durationMinutes > policy.resolutionTimeMinutes) {
            breached++;
          } else {
            withinSla++;
          }
        }

        const total = withinSla + breached;
        return {
          policyName: policy.name,
          totalTasks: total,
          withinSla,
          breached,
          complianceRate: total > 0 ? Math.round((withinSla / total) * 100) : 100,
        };
      }),
  );

  const totalAll = policyData.reduce((s, p) => s + p.totalTasks, 0);
  const withinAll = policyData.reduce((s, p) => s + p.withinSla, 0);
  const overallRate = totalAll > 0 ? Math.round((withinAll / totalAll) * 100) : 100;

  return { policies: policyData, overallComplianceRate: overallRate };
}

// ── 5. Org Summary ───────────────────────────────────────────────────

export interface OrgSummary {
  readonly totalTasks: number;
  readonly completedTasks: number;
  readonly overdueTasks: number;
  readonly activeMembers: number;
  readonly completionRate: number;
  readonly tasksCreatedThisWeek: number;
  readonly tasksCompletedThisWeek: number;
}

export async function getOrgSummary(orgId: string): Promise<OrgSummary> {
  const now = new Date();
  const weekAgo = new Date(now);
  weekAgo.setDate(weekAgo.getDate() - 7);

  const [totals] = await db
    .select({
      total: sql<number>`count(*)`,
      completed: sql<number>`count(*) filter (where ${tasks.status} = 'completed')`,
      overdue: sql<number>`count(*) filter (where ${tasks.dueDate} < now() and ${tasks.status} not in ('completed', 'cancelled'))`,
      createdWeek: sql<number>`count(*) filter (where ${tasks.createdAt} >= ${weekAgo})`,
      completedWeek: sql<number>`count(*) filter (where ${tasks.status} = 'completed' and ${tasks.completedAt} >= ${weekAgo})`,
    })
    .from(tasks)
    .where(eq(tasks.orgId, orgId));

  const [memberCount] = await db
    .select({ count: sql<number>`count(*)` })
    .from(orgMemberships)
    .where(and(eq(orgMemberships.orgId, orgId), eq(orgMemberships.status, "active")));

  const total = Number(totals?.total ?? 0);
  const completed = Number(totals?.completed ?? 0);

  return {
    totalTasks: total,
    completedTasks: completed,
    overdueTasks: Number(totals?.overdue ?? 0),
    activeMembers: Number(memberCount?.count ?? 0),
    completionRate: total > 0 ? Math.round((completed / total) * 100) : 0,
    tasksCreatedThisWeek: Number(totals?.createdWeek ?? 0),
    tasksCompletedThisWeek: Number(totals?.completedWeek ?? 0),
  };
}

// ── 6. Snapshot Persistence ──────────────────────────────────────────

export async function saveSnapshot(
  orgId: string,
  reportType: string,
  data: Record<string, unknown>,
  projectId?: string,
  periodStart?: Date,
  periodEnd?: Date,
): Promise<ReportSnapshot> {
  const now = new Date();
  const [snapshot] = await db
    .insert(reportSnapshots)
    .values({
      orgId,
      reportType,
      projectId,
      periodStart: periodStart ?? now,
      periodEnd: periodEnd ?? now,
      data,
    })
    .returning();

  return snapshot;
}

export async function getSnapshots(
  orgId: string,
  reportType: string,
  projectId?: string,
  limit: number = 10,
): Promise<readonly ReportSnapshot[]> {
  const conditions = [
    eq(reportSnapshots.orgId, orgId),
    eq(reportSnapshots.reportType, reportType),
  ];

  if (projectId) conditions.push(eq(reportSnapshots.projectId, projectId));

  return db
    .select()
    .from(reportSnapshots)
    .where(and(...conditions))
    .orderBy(desc(reportSnapshots.createdAt))
    .limit(limit);
}
