import {
  pgTable,
  uuid,
  text,
  timestamp,
  integer,
  index,
} from "drizzle-orm/pg-core";

export const pipelineRuns = pgTable(
  "pipeline_runs",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    pipelineName: text("pipeline_name").notNull(),
    status: text("status").notNull(), // 'running' | 'completed' | 'failed'
    startedAt: timestamp("started_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
    completedAt: timestamp("completed_at", { withTimezone: true }),
    itemsProcessed: integer("items_processed").default(0),
    errorMessage: text("error_message"),
  },
  (table) => [index("pipeline_runs_name_idx").on(table.pipelineName)],
);

export type PipelineRun = typeof pipelineRuns.$inferSelect;
export type NewPipelineRun = typeof pipelineRuns.$inferInsert;
