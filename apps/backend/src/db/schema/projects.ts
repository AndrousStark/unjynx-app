import {
  pgTable,
  uuid,
  text,
  timestamp,
  boolean,
  integer,
  jsonb,
  index,
  uniqueIndex,
} from "drizzle-orm/pg-core";
import { profiles } from "./profiles.js";
import { organizations } from "./organizations.js";
import { projectTypeEnum } from "./enums.js";

export const projects = pgTable(
  "projects",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    orgId: uuid("org_id").references(() => organizations.id, {
      onDelete: "cascade",
    }),
    userId: uuid("user_id")
      .references(() => profiles.id, { onDelete: "cascade" })
      .notNull(),
    name: text("name").notNull(),
    /** Short key for issue numbering (e.g., UNJX → UNJX-1, UNJX-2). */
    key: text("key"),
    description: text("description"),
    projectType: projectTypeEnum("project_type").default("kanban").notNull(),
    color: text("color").default("#6C5CE7"),
    icon: text("icon").default("folder"),
    /** Project lead / owner. */
    leadId: uuid("lead_id").references(() => profiles.id, { onDelete: "set null" }),
    /** Default assignee for new tasks in this project. */
    defaultAssigneeId: uuid("default_assignee_id").references(() => profiles.id, { onDelete: "set null" }),
    /** Workflow ID for custom statuses. Null = use default workflow. */
    workflowId: uuid("workflow_id"),
    /** Auto-incrementing counter for issue keys (UNJX-1, UNJX-2...). */
    issueCounter: integer("issue_counter").default(0).notNull(),
    isArchived: boolean("is_archived").default(false).notNull(),
    sortOrder: integer("sort_order").default(0).notNull(),
    /** Project-level settings. */
    settings: jsonb("settings")
      .$type<{
        estimationType?: "points" | "hours" | "none";
        defaultPriority?: string;
        autoAssignOnCreate?: boolean;
        requireDescription?: boolean;
        allowSubtasks?: boolean;
      }>()
      .default({})
      .notNull(),
    createdAt: timestamp("created_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (table) => [
    index("projects_org_id_idx").on(table.orgId),
    index("projects_user_id_idx").on(table.userId),
    index("projects_lead_id_idx").on(table.leadId),
    uniqueIndex("projects_org_key_idx").on(table.orgId, table.key),
  ],
);

export type Project = typeof projects.$inferSelect;
export type NewProject = typeof projects.$inferInsert;
