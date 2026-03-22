import {
  pgTable,
  uuid,
  text,
  timestamp,
  integer,
  boolean,
  jsonb,
  index,
  uniqueIndex,
} from "drizzle-orm/pg-core";
import { profiles } from "./profiles.js";

// ── Industry Modes ───────────────────────────────────────────────────

export const industryModes = pgTable(
  "industry_modes",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    slug: text("slug").unique().notNull(),
    name: text("name").notNull(),
    description: text("description"),
    icon: text("icon"),
    colorHex: text("color_hex"),
    isActive: boolean("is_active").default(true).notNull(),
    sortOrder: integer("sort_order").default(0).notNull(),
    createdAt: timestamp("created_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (table) => [
    index("industry_modes_sort_order_idx").on(table.sortOrder),
  ],
);

// ── Mode Vocabulary ──────────────────────────────────────────────────

export const modeVocabulary = pgTable(
  "mode_vocabulary",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    modeId: uuid("mode_id")
      .references(() => industryModes.id, { onDelete: "cascade" })
      .notNull(),
    originalTerm: text("original_term").notNull(),
    translatedTerm: text("translated_term").notNull(),
  },
  (table) => [
    index("mode_vocabulary_mode_id_idx").on(table.modeId),
    uniqueIndex("mode_vocabulary_mode_original_idx").on(
      table.modeId,
      table.originalTerm,
    ),
  ],
);

// ── Mode Templates ───────────────────────────────────────────────────

export const modeTemplates = pgTable(
  "mode_templates",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    modeId: uuid("mode_id")
      .references(() => industryModes.id, { onDelete: "cascade" })
      .notNull(),
    name: text("name").notNull(),
    description: text("description"),
    subtasksJson: jsonb("subtasks_json").$type<string[]>().default([]),
    category: text("category"),
    sortOrder: integer("sort_order").default(0).notNull(),
  },
  (table) => [
    index("mode_templates_mode_id_idx").on(table.modeId),
  ],
);

// ── Mode Dashboard Widgets ───────────────────────────────────────────

export const modeDashboardWidgets = pgTable(
  "mode_dashboard_widgets",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    modeId: uuid("mode_id")
      .references(() => industryModes.id, { onDelete: "cascade" })
      .notNull(),
    widgetType: text("widget_type").notNull(),
    configJson: jsonb("config_json").$type<Record<string, unknown>>().default({}),
    sortOrder: integer("sort_order").default(0).notNull(),
  },
  (table) => [
    index("mode_dashboard_widgets_mode_id_idx").on(table.modeId),
  ],
);

// ── User Mode Preference ─────────────────────────────────────────────

export const userModePreference = pgTable(
  "user_mode_preference",
  {
    userId: uuid("user_id")
      .primaryKey()
      .references(() => profiles.id, { onDelete: "cascade" }),
    modeId: uuid("mode_id")
      .references(() => industryModes.id, { onDelete: "set null" }),
    activeSince: timestamp("active_since", { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
);

// ── Type Exports ─────────────────────────────────────────────────────

export type IndustryMode = typeof industryModes.$inferSelect;
export type NewIndustryMode = typeof industryModes.$inferInsert;
export type ModeVocabularyEntry = typeof modeVocabulary.$inferSelect;
export type NewModeVocabularyEntry = typeof modeVocabulary.$inferInsert;
export type ModeTemplate = typeof modeTemplates.$inferSelect;
export type NewModeTemplate = typeof modeTemplates.$inferInsert;
export type ModeDashboardWidget = typeof modeDashboardWidgets.$inferSelect;
export type NewModeDashboardWidget = typeof modeDashboardWidgets.$inferInsert;
export type UserModePreferenceRow = typeof userModePreference.$inferSelect;
export type NewUserModePreferenceRow = typeof userModePreference.$inferInsert;
