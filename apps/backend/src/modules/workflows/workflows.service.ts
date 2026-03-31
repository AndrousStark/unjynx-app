// ── Workflow Service ──────────────────────────────────────────────────
//
// Manages configurable workflows (status pipelines) for projects.
// Each workflow defines statuses and allowed transitions between them.

import { eq, and, isNull } from "drizzle-orm";
import { db } from "../../db/index.js";
import {
  workflows,
  workflowStatuses,
  workflowTransitions,
  projects,
  type Workflow,
  type WorkflowStatus,
  type WorkflowTransition,
} from "../../db/schema/index.js";
import { logger } from "../../middleware/logger.js";

const log = logger.child({ module: "workflows" });

// ── Types ────────────────────────────────────────────────────────────

export interface WorkflowWithStatuses extends Workflow {
  readonly statuses: readonly WorkflowStatus[];
  readonly transitions: readonly WorkflowTransition[];
}

// ── Read ─────────────────────────────────────────────────────────────

/**
 * Get all workflows available to an org (org-specific + system workflows).
 */
export async function getWorkflows(orgId: string | null): Promise<readonly Workflow[]> {
  if (!orgId) {
    return db.select().from(workflows).where(eq(workflows.isSystem, true));
  }

  // Org workflows + system workflows
  const rows = await db
    .select()
    .from(workflows)
    .where(
      // org_id = orgId OR (org_id IS NULL AND is_system = true)
      eq(workflows.isSystem, true),
    );

  const orgRows = await db
    .select()
    .from(workflows)
    .where(eq(workflows.orgId, orgId));

  return [...rows, ...orgRows];
}

/**
 * Get a workflow with its statuses and transitions.
 */
export async function getWorkflowDetail(workflowId: string): Promise<WorkflowWithStatuses | null> {
  const [workflow] = await db
    .select()
    .from(workflows)
    .where(eq(workflows.id, workflowId))
    .limit(1);

  if (!workflow) return null;

  const [statuses, transitions] = await Promise.all([
    db
      .select()
      .from(workflowStatuses)
      .where(eq(workflowStatuses.workflowId, workflowId))
      .orderBy(workflowStatuses.sortOrder),
    db
      .select()
      .from(workflowTransitions)
      .where(eq(workflowTransitions.workflowId, workflowId)),
  ]);

  return { ...workflow, statuses, transitions };
}

/**
 * Get the default workflow (system default or org default).
 */
export async function getDefaultWorkflow(orgId: string | null): Promise<Workflow | null> {
  // Try org-level default first
  if (orgId) {
    const [orgDefault] = await db
      .select()
      .from(workflows)
      .where(and(eq(workflows.orgId, orgId), eq(workflows.isDefault, true)))
      .limit(1);
    if (orgDefault) return orgDefault;
  }

  // Fall back to system default
  const [systemDefault] = await db
    .select()
    .from(workflows)
    .where(and(eq(workflows.isSystem, true), eq(workflows.isDefault, true)))
    .limit(1);

  return systemDefault ?? null;
}

/**
 * Get the initial status for a workflow (where new tasks start).
 */
export async function getInitialStatus(workflowId: string): Promise<WorkflowStatus | null> {
  const [status] = await db
    .select()
    .from(workflowStatuses)
    .where(
      and(
        eq(workflowStatuses.workflowId, workflowId),
        eq(workflowStatuses.isInitial, true),
      ),
    )
    .limit(1);

  return status ?? null;
}

/**
 * Get statuses for a workflow.
 */
export async function getStatuses(workflowId: string): Promise<readonly WorkflowStatus[]> {
  return db
    .select()
    .from(workflowStatuses)
    .where(eq(workflowStatuses.workflowId, workflowId))
    .orderBy(workflowStatuses.sortOrder);
}

// ── Transitions ──────────────────────────────────────────────────────

/**
 * Validate if a status transition is allowed.
 * Returns the transition if allowed, null if not.
 */
export async function validateTransition(
  workflowId: string,
  fromStatusId: string,
  toStatusId: string,
  userRole?: string,
): Promise<WorkflowTransition | null> {
  const [transition] = await db
    .select()
    .from(workflowTransitions)
    .where(
      and(
        eq(workflowTransitions.workflowId, workflowId),
        eq(workflowTransitions.fromStatusId, fromStatusId),
        eq(workflowTransitions.toStatusId, toStatusId),
      ),
    )
    .limit(1);

  if (!transition) return null;

  // Check role permission
  const allowedRoles = (transition.allowedRoles as string[] | null) ?? [];
  if (allowedRoles.length > 0 && userRole && !allowedRoles.includes(userRole)) {
    return null;
  }

  return transition;
}

/**
 * Get all allowed transitions from a given status.
 */
export async function getAvailableTransitions(
  workflowId: string,
  fromStatusId: string,
): Promise<readonly (WorkflowTransition & { toStatus: WorkflowStatus })[]> {
  const transitions = await db
    .select()
    .from(workflowTransitions)
    .where(
      and(
        eq(workflowTransitions.workflowId, workflowId),
        eq(workflowTransitions.fromStatusId, fromStatusId),
      ),
    );

  // Enrich with target status details
  const enriched = await Promise.all(
    transitions.map(async (t) => {
      const [toStatus] = await db
        .select()
        .from(workflowStatuses)
        .where(eq(workflowStatuses.id, t.toStatusId))
        .limit(1);
      return { ...t, toStatus: toStatus! };
    }),
  );

  return enriched.filter((t) => t.toStatus);
}

// ── Issue Key Generation ─────────────────────────────────────────────

/**
 * Generate the next issue key for a project.
 * Atomically increments the project's issue_counter via SQL.
 * Returns e.g., "UNJX-42".
 */
export async function generateIssueKey(projectId: string): Promise<string> {
  const { sql: rawSql } = await import("drizzle-orm");

  const [result] = await db
    .update(projects)
    .set({
      issueCounter: rawSql`${projects.issueCounter} + 1`,
      updatedAt: new Date(),
    } as never)
    .where(eq(projects.id, projectId))
    .returning({ key: projects.key, counter: projects.issueCounter });

  if (!result) throw new Error("Project not found");

  const key = result.key ?? "TASK";
  return `${key}-${result.counter}`;
}

// ── Write (Org Workflows) ────────────────────────────────────────────

/**
 * Create a custom workflow for an org.
 */
export async function createWorkflow(
  orgId: string,
  data: { name: string; description?: string; isDefault?: boolean },
): Promise<Workflow> {
  // If setting as default, unset any existing default
  if (data.isDefault) {
    await db
      .update(workflows)
      .set({ isDefault: false })
      .where(and(eq(workflows.orgId, orgId), eq(workflows.isDefault, true)));
  }

  const [workflow] = await db
    .insert(workflows)
    .values({
      orgId,
      name: data.name,
      description: data.description,
      isDefault: data.isDefault ?? false,
    })
    .returning();

  log.info({ orgId, workflowId: workflow.id, name: data.name }, "Workflow created");
  return workflow;
}

/**
 * Add a status to a workflow.
 */
export async function addStatus(
  workflowId: string,
  orgId: string | null,
  data: {
    name: string;
    category: "todo" | "in_progress" | "done";
    color?: string;
    sortOrder?: number;
    isInitial?: boolean;
    isFinal?: boolean;
  },
): Promise<WorkflowStatus> {
  const [status] = await db
    .insert(workflowStatuses)
    .values({
      workflowId,
      orgId,
      name: data.name,
      category: data.category,
      color: data.color,
      sortOrder: data.sortOrder ?? 0,
      isInitial: data.isInitial ?? false,
      isFinal: data.isFinal ?? false,
    })
    .returning();

  return status;
}

/**
 * Add a transition between two statuses.
 */
export async function addTransition(
  workflowId: string,
  orgId: string | null,
  data: {
    fromStatusId: string;
    toStatusId: string;
    name?: string;
  },
): Promise<WorkflowTransition> {
  const [transition] = await db
    .insert(workflowTransitions)
    .values({
      workflowId,
      orgId,
      fromStatusId: data.fromStatusId,
      toStatusId: data.toStatusId,
      name: data.name,
    })
    .returning();

  return transition;
}
