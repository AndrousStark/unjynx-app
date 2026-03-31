// ── GDPR Service ─────────────────────────────────────────────────────
//
// Per-organization data export (Article 20 — Right to Portability)
// and deletion (Article 17 — Right to Erasure).

import { eq, sql } from "drizzle-orm";
import { db } from "../../db/index.js";
import {
  organizations,
  orgMemberships,
  orgInvites,
  orgTeams,
  orgTeamMembers,
  tasks,
  projects,
  sections,
  comments,
  tags,
  attachments,
  goals,
  goalTaskLinks,
} from "../../db/schema/index.js";
import { logger } from "../../middleware/logger.js";

const log = logger.child({ module: "gdpr" });

// ── Data Export ──────────────────────────────────────────────────────

export interface OrgDataExport {
  readonly orgId: string;
  readonly orgName: string;
  readonly exportedAt: string;
  readonly data: {
    readonly members: readonly Record<string, unknown>[];
    readonly projects: readonly Record<string, unknown>[];
    readonly tasks: readonly Record<string, unknown>[];
    readonly comments: readonly Record<string, unknown>[];
    readonly goals: readonly Record<string, unknown>[];
  };
  readonly counts: Record<string, number>;
}

export async function exportOrgData(orgId: string): Promise<OrgDataExport> {
  const [org] = await db
    .select({ name: organizations.name })
    .from(organizations)
    .where(eq(organizations.id, orgId))
    .limit(1);

  if (!org) throw new Error("Organization not found");

  // Export all org-scoped data
  const [memberRows, projectRows, taskRows, commentRows, goalRows] = await Promise.all([
    db.select().from(orgMemberships).where(eq(orgMemberships.orgId, orgId)),
    db.select().from(projects).where(eq(projects.orgId, orgId)),
    db.select().from(tasks).where(eq(tasks.orgId, orgId)),
    db.select().from(comments).where(eq(comments.orgId, orgId)),
    db.select().from(goals).where(eq(goals.orgId, orgId)),
  ]);

  log.info(
    { orgId, tasks: taskRows.length, projects: projectRows.length },
    "Org data exported for GDPR",
  );

  return {
    orgId,
    orgName: org.name,
    exportedAt: new Date().toISOString(),
    data: {
      members: memberRows,
      projects: projectRows,
      tasks: taskRows,
      comments: commentRows,
      goals: goalRows,
    },
    counts: {
      members: memberRows.length,
      projects: projectRows.length,
      tasks: taskRows.length,
      comments: commentRows.length,
      goals: goalRows.length,
    },
  };
}

// ── Data Deletion ────────────────────────────────────────────────────

export interface DeletionResult {
  readonly orgId: string;
  readonly deletedAt: string;
  readonly tablesCleared: readonly string[];
}

/**
 * Permanently delete all data for an organization.
 * CASCADE foreign keys handle child records automatically.
 *
 * WARNING: This is irreversible. Caller must verify authorization.
 */
export async function deleteOrgData(orgId: string): Promise<DeletionResult> {
  const [org] = await db
    .select({ id: organizations.id, name: organizations.name })
    .from(organizations)
    .where(eq(organizations.id, orgId))
    .limit(1);

  if (!org) throw new Error("Organization not found");

  // Delete the org — CASCADE handles all child tables
  await db.delete(organizations).where(eq(organizations.id, orgId));

  log.warn({ orgId, orgName: org.name }, "Organization data permanently deleted (GDPR erasure)");

  return {
    orgId,
    deletedAt: new Date().toISOString(),
    tablesCleared: [
      "organizations", "org_memberships", "org_invites", "org_teams", "org_team_members",
      "projects", "tasks", "sections", "comments", "tags", "attachments",
      "workflows", "workflow_statuses", "workflow_transitions",
      "task_watchers", "task_links", "time_entries", "task_activity",
      "sprints", "sprint_tasks", "sprint_burndown",
      "msg_channels", "msg_channel_members", "messages", "message_reactions", "pinned_messages",
      "custom_field_definitions", "custom_field_values", "sla_policies",
      "ai_operations", "ai_suggestions",
      "report_snapshots", "goals", "goal_task_links",
    ],
  };
}
