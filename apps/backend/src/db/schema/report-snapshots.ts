// ── Report Snapshots ─────────────────────────────────────────────────
//
// Stores pre-computed analytics data for fast dashboard rendering:
//   - Sprint velocity (points per sprint)
//   - Cycle time / lead time distributions
//   - Team workload snapshots
//   - SLA compliance rates
//
// Snapshots are generated on-demand or by scheduled cron jobs.

import {
  pgTable,
  uuid,
  text,
  jsonb,
  timestamp,
  index,
} from "drizzle-orm/pg-core";
import { organizations } from "./organizations.js";
import { projects } from "./projects.js";

export const reportSnapshots = pgTable(
  "report_snapshots",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    orgId: uuid("org_id")
      .references(() => organizations.id, { onDelete: "cascade" })
      .notNull(),
    /** Report type: velocity, burndown, cycle_time, workload, sla, summary */
    reportType: text("report_type").notNull(),
    /** Scope to a specific project (null = org-wide). */
    projectId: uuid("project_id").references(() => projects.id, {
      onDelete: "cascade",
    }),
    /** Period start (inclusive). */
    periodStart: timestamp("period_start", { withTimezone: true }).notNull(),
    /** Period end (inclusive). */
    periodEnd: timestamp("period_end", { withTimezone: true }).notNull(),
    /** The actual report data (varies by reportType). */
    data: jsonb("data").$type<Record<string, unknown>>().notNull(),
    /** Who or what generated this snapshot. */
    generatedBy: text("generated_by").default("system").notNull(),
    createdAt: timestamp("created_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (table) => [
    index("report_snapshots_org_id_idx").on(table.orgId),
    index("report_snapshots_type_idx").on(table.orgId, table.reportType),
    index("report_snapshots_project_idx").on(table.projectId),
    index("report_snapshots_period_idx").on(table.periodStart, table.periodEnd),
  ],
);

export type ReportSnapshot = typeof reportSnapshots.$inferSelect;
export type NewReportSnapshot = typeof reportSnapshots.$inferInsert;
