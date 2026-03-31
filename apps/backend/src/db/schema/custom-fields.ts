// ── Custom Fields ────────────────────────────────────────────────────
//
// Org-level custom field definitions + per-task field values.
// Supports 13 field types for industry-specific data capture.
//
// Resolution: Mode default fields → Org field definitions → Task values
//
// Example (Legal mode):
//   Definition: { name: "Case Number", fieldKey: "case_number", fieldType: "text" }
//   Value on task: { fieldId: "...", value: "2026-CV-1234" }

import {
  pgTable,
  uuid,
  text,
  boolean,
  integer,
  jsonb,
  timestamp,
  index,
  uniqueIndex,
} from "drizzle-orm/pg-core";
import { organizations } from "./organizations.js";
import { tasks } from "./tasks.js";

// ── Custom Field Definitions ─────────────────────────────────────────

export const customFieldDefinitions = pgTable(
  "custom_field_definitions",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    orgId: uuid("org_id")
      .references(() => organizations.id, { onDelete: "cascade" })
      .notNull(),
    /** Display name shown in UI. */
    name: text("name").notNull(),
    /** Machine-readable key (snake_case, unique per org). */
    fieldKey: text("field_key").notNull(),
    /** Field type determines the UI renderer and validation. */
    fieldType: text("field_type").notNull(),
    // Supported types:
    //   text, number, date, select, multi_select,
    //   user, url, checkbox, email, phone,
    //   rich_text, label, currency
    description: text("description"),
    isRequired: boolean("is_required").default(false).notNull(),
    /** Default value for new tasks (JSONB for any type). */
    defaultValue: jsonb("default_value").$type<unknown>(),
    /** Options for select/multi_select fields. */
    options: jsonb("options").$type<{
      choices?: readonly { label: string; value: string; color?: string }[];
      currency?: string;
      min?: number;
      max?: number;
      placeholder?: string;
    }>(),
    /** Which task types this field applies to (null = all). */
    applicableTaskTypes: jsonb("applicable_task_types")
      .$type<string[]>()
      .default(["task", "story", "bug", "epic"]),
    /** Restrict to specific projects (null = all projects in org). */
    applicableProjectIds: jsonb("applicable_project_ids").$type<string[]>(),
    sortOrder: integer("sort_order").default(0).notNull(),
    isArchived: boolean("is_archived").default(false).notNull(),
    createdAt: timestamp("created_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (table) => [
    uniqueIndex("custom_field_defs_org_key_idx").on(table.orgId, table.fieldKey),
    index("custom_field_defs_org_id_idx").on(table.orgId),
  ],
);

// ── Custom Field Values ──────────────────────────────────────────────

export const customFieldValues = pgTable(
  "custom_field_values",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    orgId: uuid("org_id")
      .references(() => organizations.id, { onDelete: "cascade" })
      .notNull(),
    taskId: uuid("task_id")
      .references(() => tasks.id, { onDelete: "cascade" })
      .notNull(),
    fieldId: uuid("field_id")
      .references(() => customFieldDefinitions.id, { onDelete: "cascade" })
      .notNull(),
    /** Stored as JSONB to support any type (string, number, date, array, etc.) */
    value: jsonb("value").notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (table) => [
    uniqueIndex("custom_field_values_task_field_idx").on(table.taskId, table.fieldId),
    index("custom_field_values_org_id_idx").on(table.orgId),
    index("custom_field_values_task_id_idx").on(table.taskId),
    index("custom_field_values_value_idx").using("gin", table.value),
  ],
);

// ── Type Exports ─────────────────────────────────────────────────────

export type CustomFieldDefinition = typeof customFieldDefinitions.$inferSelect;
export type NewCustomFieldDefinition = typeof customFieldDefinitions.$inferInsert;
export type CustomFieldValue = typeof customFieldValues.$inferSelect;
export type NewCustomFieldValue = typeof customFieldValues.$inferInsert;
