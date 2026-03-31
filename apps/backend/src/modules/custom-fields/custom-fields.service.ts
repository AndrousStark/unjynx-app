// ── Custom Fields Service ────────────────────────────────────────────
//
// Manages org-level custom field definitions and per-task values.

import { eq, and } from "drizzle-orm";
import { db } from "../../db/index.js";
import {
  customFieldDefinitions,
  customFieldValues,
  slaPolicies,
  type CustomFieldDefinition,
  type CustomFieldValue,
  type SlaPolicy,
} from "../../db/schema/index.js";
import { logger } from "../../middleware/logger.js";

const log = logger.child({ module: "custom-fields" });

// ── Field Definitions ────────────────────────────────────────────────

const VALID_FIELD_TYPES = [
  "text", "number", "date", "select", "multi_select",
  "user", "url", "checkbox", "email", "phone",
  "rich_text", "label", "currency",
] as const;

export async function createFieldDefinition(
  orgId: string,
  data: {
    name: string;
    fieldKey: string;
    fieldType: string;
    description?: string;
    isRequired?: boolean;
    defaultValue?: unknown;
    options?: Record<string, unknown>;
    applicableTaskTypes?: string[];
    applicableProjectIds?: string[];
  },
): Promise<CustomFieldDefinition> {
  if (!VALID_FIELD_TYPES.includes(data.fieldType as typeof VALID_FIELD_TYPES[number])) {
    throw new Error(`Invalid field type: ${data.fieldType}. Valid types: ${VALID_FIELD_TYPES.join(", ")}`);
  }

  const [field] = await db
    .insert(customFieldDefinitions)
    .values({
      orgId,
      name: data.name,
      fieldKey: data.fieldKey,
      fieldType: data.fieldType,
      description: data.description,
      isRequired: data.isRequired ?? false,
      defaultValue: data.defaultValue,
      options: data.options as CustomFieldDefinition["options"],
      applicableTaskTypes: data.applicableTaskTypes ?? ["task", "story", "bug", "epic"],
      applicableProjectIds: data.applicableProjectIds,
    })
    .returning();

  log.info({ orgId, fieldKey: data.fieldKey, fieldType: data.fieldType }, "Custom field created");
  return field;
}

export async function getFieldDefinitions(
  orgId: string,
): Promise<readonly CustomFieldDefinition[]> {
  return db
    .select()
    .from(customFieldDefinitions)
    .where(
      and(
        eq(customFieldDefinitions.orgId, orgId),
        eq(customFieldDefinitions.isArchived, false),
      ),
    )
    .orderBy(customFieldDefinitions.sortOrder);
}

export async function getFieldDefinition(
  fieldId: string,
): Promise<CustomFieldDefinition | null> {
  const [field] = await db
    .select()
    .from(customFieldDefinitions)
    .where(eq(customFieldDefinitions.id, fieldId))
    .limit(1);
  return field ?? null;
}

export async function updateFieldDefinition(
  fieldId: string,
  data: {
    name?: string;
    description?: string;
    isRequired?: boolean;
    options?: Record<string, unknown>;
    sortOrder?: number;
  },
): Promise<CustomFieldDefinition> {
  const [updated] = await db
    .update(customFieldDefinitions)
    .set(data as Partial<CustomFieldDefinition>)
    .where(eq(customFieldDefinitions.id, fieldId))
    .returning();
  if (!updated) throw new Error("Field definition not found");
  return updated;
}

export async function archiveFieldDefinition(fieldId: string): Promise<void> {
  await db
    .update(customFieldDefinitions)
    .set({ isArchived: true })
    .where(eq(customFieldDefinitions.id, fieldId));
}

// ── Field Values (per task) ──────────────────────────────────────────

export async function setFieldValue(
  orgId: string,
  taskId: string,
  fieldId: string,
  value: unknown,
): Promise<CustomFieldValue> {
  // Upsert: insert or update on conflict
  const existing = await db
    .select({ id: customFieldValues.id })
    .from(customFieldValues)
    .where(
      and(
        eq(customFieldValues.taskId, taskId),
        eq(customFieldValues.fieldId, fieldId),
      ),
    )
    .limit(1);

  if (existing.length > 0) {
    const [updated] = await db
      .update(customFieldValues)
      .set({ value, updatedAt: new Date() })
      .where(eq(customFieldValues.id, existing[0].id))
      .returning();
    return updated;
  }

  const [inserted] = await db
    .insert(customFieldValues)
    .values({ orgId, taskId, fieldId, value })
    .returning();

  return inserted;
}

export async function getFieldValues(
  taskId: string,
): Promise<readonly CustomFieldValue[]> {
  return db
    .select()
    .from(customFieldValues)
    .where(eq(customFieldValues.taskId, taskId));
}

export async function deleteFieldValue(
  taskId: string,
  fieldId: string,
): Promise<void> {
  await db
    .delete(customFieldValues)
    .where(
      and(
        eq(customFieldValues.taskId, taskId),
        eq(customFieldValues.fieldId, fieldId),
      ),
    );
}

// ── SLA Policies ─────────────────────────────────────────────────────

export async function createSlaPolicy(
  orgId: string,
  data: {
    name: string;
    description?: string;
    projectId?: string;
    conditions?: { priorities?: string[]; taskTypes?: string[] };
    responseTimeMinutes?: number;
    resolutionTimeMinutes?: number;
    businessHours?: Record<string, { start: string; end: string }>;
    timezone?: string;
  },
): Promise<SlaPolicy> {
  const [policy] = await db
    .insert(slaPolicies)
    .values({
      orgId,
      name: data.name,
      description: data.description,
      projectId: data.projectId,
      conditions: data.conditions ?? {},
      responseTimeMinutes: data.responseTimeMinutes,
      resolutionTimeMinutes: data.resolutionTimeMinutes,
      businessHours: data.businessHours as SlaPolicy["businessHours"],
      timezone: data.timezone ?? "Asia/Kolkata",
    })
    .returning();

  log.info({ orgId, policyId: policy.id, name: data.name }, "SLA policy created");
  return policy;
}

export async function getSlaPolicies(
  orgId: string,
  projectId?: string,
): Promise<readonly SlaPolicy[]> {
  const conditions = [eq(slaPolicies.orgId, orgId), eq(slaPolicies.isActive, true)];
  if (projectId) {
    // Get project-specific + org-wide policies
    return db
      .select()
      .from(slaPolicies)
      .where(
        and(
          eq(slaPolicies.orgId, orgId),
          eq(slaPolicies.isActive, true),
        ),
      )
      .then((rows) =>
        rows.filter((r) => r.projectId === projectId || r.projectId === null),
      );
  }

  return db
    .select()
    .from(slaPolicies)
    .where(and(...conditions));
}

export async function getSlaPolicy(policyId: string): Promise<SlaPolicy | null> {
  const [policy] = await db
    .select()
    .from(slaPolicies)
    .where(eq(slaPolicies.id, policyId))
    .limit(1);
  return policy ?? null;
}

export async function updateSlaPolicy(
  policyId: string,
  data: {
    name?: string;
    description?: string;
    responseTimeMinutes?: number;
    resolutionTimeMinutes?: number;
    businessHours?: Record<string, { start: string; end: string }>;
    timezone?: string;
    isActive?: boolean;
  },
): Promise<SlaPolicy> {
  const [updated] = await db
    .update(slaPolicies)
    .set({ ...data as Partial<SlaPolicy>, updatedAt: new Date() })
    .where(eq(slaPolicies.id, policyId))
    .returning();
  if (!updated) throw new Error("SLA policy not found");
  return updated;
}

export async function deleteSlaPolicy(policyId: string): Promise<void> {
  await db.delete(slaPolicies).where(eq(slaPolicies.id, policyId));
}
