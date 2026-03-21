import {
  pgTable,
  text,
  integer,
  real,
  boolean,
  timestamp,
} from "drizzle-orm/pg-core";

export const aiModelConfigs = pgTable("ai_model_configs", {
  key: text("key").primaryKey(),
  modelId: text("model_id").notNull(),
  provider: text("provider").notNull(),
  maxTokens: integer("max_tokens").default(4096).notNull(),
  temperature: real("temperature").default(0.7).notNull(),
  isActive: boolean("is_active").default(true).notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true })
    .defaultNow()
    .notNull(),
});

export type AiModelConfig = typeof aiModelConfigs.$inferSelect;
export type NewAiModelConfig = typeof aiModelConfigs.$inferInsert;
