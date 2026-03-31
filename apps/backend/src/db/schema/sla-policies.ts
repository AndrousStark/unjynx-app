// ── SLA Policies ─────────────────────────────────────────────────────
//
// Service Level Agreement tracking per project:
//   - Response time: how quickly a task gets a first response
//   - Resolution time: how quickly a task gets resolved
//   - Business hours: configurable working hours per org
//   - Breach detection: cron checks every 15 min for SLA violations

import {
  pgTable,
  uuid,
  text,
  integer,
  boolean,
  jsonb,
  timestamp,
  index,
} from "drizzle-orm/pg-core";
import { organizations } from "./organizations.js";
import { projects } from "./projects.js";

export const slaPolicies = pgTable(
  "sla_policies",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    orgId: uuid("org_id")
      .references(() => organizations.id, { onDelete: "cascade" })
      .notNull(),
    /** Specific project (null = org-wide default). */
    projectId: uuid("project_id").references(() => projects.id, {
      onDelete: "cascade",
    }),
    name: text("name").notNull(),
    description: text("description"),
    /** Conditions: which tasks this SLA applies to. */
    conditions: jsonb("conditions")
      .$type<{
        priorities?: string[];
        taskTypes?: string[];
      }>()
      .default({})
      .notNull(),
    /** Max minutes for first response (null = no SLA). */
    responseTimeMinutes: integer("response_time_minutes"),
    /** Max minutes for resolution (null = no SLA). */
    resolutionTimeMinutes: integer("resolution_time_minutes"),
    /** Business hours definition (SLA clock only ticks during these hours). */
    businessHours: jsonb("business_hours")
      .$type<Record<string, { start: string; end: string }>>()
      .default({
        "mon": { start: "09:00", end: "18:00" },
        "tue": { start: "09:00", end: "18:00" },
        "wed": { start: "09:00", end: "18:00" },
        "thu": { start: "09:00", end: "18:00" },
        "fri": { start: "09:00", end: "18:00" },
      })
      .notNull(),
    /** Timezone for business hours calculation. */
    timezone: text("timezone").default("Asia/Kolkata").notNull(),
    isActive: boolean("is_active").default(true).notNull(),
    createdAt: timestamp("created_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (table) => [
    index("sla_policies_org_id_idx").on(table.orgId),
    index("sla_policies_project_id_idx").on(table.projectId),
  ],
);

// ── Type Exports ─────────────────────────────────────────────────────

export type SlaPolicy = typeof slaPolicies.$inferSelect;
export type NewSlaPolicy = typeof slaPolicies.$inferInsert;
