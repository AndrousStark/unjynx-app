import {
  pgTable,
  uuid,
  text,
  timestamp,
  integer,
  jsonb,
  index,
} from "drizzle-orm/pg-core";
import { profiles } from "./profiles.js";
import {
  teamRoleEnum,
  teamMemberStatusEnum,
  teamInviteStatusEnum,
  userPlanEnum,
} from "./enums.js";

export const teams = pgTable(
  "teams",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    name: text("name").notNull(),
    ownerId: uuid("owner_id")
      .references(() => profiles.id, { onDelete: "cascade" })
      .notNull(),
    plan: userPlanEnum("plan").default("team").notNull(),
    logoUrl: text("logo_url"),
    maxMembers: integer("max_members").default(50).notNull(),
    createdAt: timestamp("created_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (table) => [
    index("teams_owner_id_idx").on(table.ownerId),
  ],
);

export const teamMembers = pgTable(
  "team_members",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    teamId: uuid("team_id")
      .references(() => teams.id, { onDelete: "cascade" })
      .notNull(),
    userId: uuid("user_id")
      .references(() => profiles.id, { onDelete: "cascade" })
      .notNull(),
    role: teamRoleEnum("role").default("member").notNull(),
    status: teamMemberStatusEnum("status").default("active").notNull(),
    joinedAt: timestamp("joined_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
    invitedBy: uuid("invited_by").references(() => profiles.id, {
      onDelete: "set null",
    }),
  },
  (table) => [
    index("team_members_team_id_idx").on(table.teamId),
    index("team_members_user_id_idx").on(table.userId),
  ],
);

export const teamInvites = pgTable(
  "team_invites",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    teamId: uuid("team_id")
      .references(() => teams.id, { onDelete: "cascade" })
      .notNull(),
    email: text("email").notNull(),
    role: teamRoleEnum("role").default("member").notNull(),
    inviteCode: text("invite_code").unique().notNull(),
    expiresAt: timestamp("expires_at", { withTimezone: true }).notNull(),
    status: teamInviteStatusEnum("status").default("pending").notNull(),
    createdAt: timestamp("created_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (table) => [
    index("team_invites_team_id_idx").on(table.teamId),
    index("team_invites_code_idx").on(table.inviteCode),
  ],
);

export const standups = pgTable(
  "standups",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    teamId: uuid("team_id")
      .references(() => teams.id, { onDelete: "cascade" })
      .notNull(),
    userId: uuid("user_id")
      .references(() => profiles.id, { onDelete: "cascade" })
      .notNull(),
    doneYesterday: jsonb("done_yesterday").$type<string[]>().default([]),
    plannedToday: jsonb("planned_today").$type<string[]>().default([]),
    blockers: text("blockers"),
    submittedAt: timestamp("submitted_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (table) => [
    index("standups_team_id_idx").on(table.teamId),
    index("standups_user_id_idx").on(table.userId),
    index("standups_submitted_at_idx").on(table.submittedAt),
  ],
);

export type Team = typeof teams.$inferSelect;
export type NewTeam = typeof teams.$inferInsert;
export type TeamMember = typeof teamMembers.$inferSelect;
export type NewTeamMember = typeof teamMembers.$inferInsert;
export type TeamInvite = typeof teamInvites.$inferSelect;
export type NewTeamInvite = typeof teamInvites.$inferInsert;
export type Standup = typeof standups.$inferSelect;
export type NewStandup = typeof standups.$inferInsert;
