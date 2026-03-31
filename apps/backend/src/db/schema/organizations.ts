// ── Organizations (Multi-Tenant Root Entity) ────────────────────────
//
// Every org-scoped entity references organizations.id via org_id.
// PostgreSQL Row-Level Security (RLS) enforces tenant isolation.
// Users can belong to multiple orgs and switch between them.

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
import {
  userPlanEnum,
  orgRoleEnum,
  orgInviteStatusEnum,
  orgMemberStatusEnum,
} from "./enums.js";

// ── Organizations ────────────────────────────────────────────────────

export const organizations = pgTable(
  "organizations",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    name: text("name").notNull(),
    slug: text("slug").unique().notNull(),
    logoUrl: text("logo_url"),
    plan: userPlanEnum("plan").default("free").notNull(),
    billingEmail: text("billing_email"),
    ownerId: uuid("owner_id")
      .references(() => profiles.id, { onDelete: "cascade" })
      .notNull(),
    /** Logto Organization ID for RBAC sync. */
    logtoOrgId: text("logto_org_id").unique(),
    /** Industry mode slug (legal, healthcare, dev_teams, etc.) */
    industryMode: text("industry_mode"),
    maxMembers: integer("max_members").default(5).notNull(),
    maxProjects: integer("max_projects").default(3).notNull(),
    maxStorageMb: integer("max_storage_mb").default(500).notNull(),
    /** Org-level settings: timezone, branding, defaults, etc. */
    settings: jsonb("settings")
      .$type<{
        timezone?: string;
        language?: string;
        defaultProjectType?: string;
        defaultTaskType?: string;
        requireMfa?: boolean;
        ipAllowlist?: string[];
        branding?: {
          primaryColor?: string;
          secondaryColor?: string;
          fontFamily?: string;
        };
      }>()
      .default({})
      .notNull(),
    /** True = auto-created personal workspace for a user. */
    isPersonal: boolean("is_personal").default(false).notNull(),
    isActive: boolean("is_active").default(true).notNull(),
    trialEndsAt: timestamp("trial_ends_at", { withTimezone: true }),
    createdAt: timestamp("created_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (table) => [
    index("organizations_owner_id_idx").on(table.ownerId),
    index("organizations_plan_idx").on(table.plan),
    index("organizations_mode_idx").on(table.industryMode),
  ],
);

// ── Organization Members ─────────────────────────────────────────────

export const orgMemberships = pgTable(
  "org_memberships",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    orgId: uuid("org_id")
      .references(() => organizations.id, { onDelete: "cascade" })
      .notNull(),
    userId: uuid("user_id")
      .references(() => profiles.id, { onDelete: "cascade" })
      .notNull(),
    role: orgRoleEnum("role").default("member").notNull(),
    status: orgMemberStatusEnum("status").default("active").notNull(),
    invitedBy: uuid("invited_by").references(() => profiles.id, {
      onDelete: "set null",
    }),
    invitedAt: timestamp("invited_at", { withTimezone: true }),
    joinedAt: timestamp("joined_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
    lastActiveAt: timestamp("last_active_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
    /** Per-member preferences within this org (notification settings, sidebar order, etc.) */
    preferences: jsonb("preferences")
      .$type<{
        notificationChannel?: string;
        sidebarOrder?: string[];
        defaultView?: string;
      }>()
      .default({})
      .notNull(),
  },
  (table) => [
    uniqueIndex("org_memberships_org_user_idx").on(table.orgId, table.userId),
    index("org_memberships_user_id_idx").on(table.userId),
  ],
);

// ── Organization Invites ─────────────────────────────────────────────

export const orgInvites = pgTable(
  "org_invites",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    orgId: uuid("org_id")
      .references(() => organizations.id, { onDelete: "cascade" })
      .notNull(),
    email: text("email").notNull(),
    role: orgRoleEnum("role").default("member").notNull(),
    inviteCode: text("invite_code").unique().notNull(),
    /** email, link, or sso */
    inviteType: text("invite_type").default("email").notNull(),
    invitedBy: uuid("invited_by")
      .references(() => profiles.id)
      .notNull(),
    expiresAt: timestamp("expires_at", { withTimezone: true }).notNull(),
    acceptedAt: timestamp("accepted_at", { withTimezone: true }),
    status: orgInviteStatusEnum("status").default("pending").notNull(),
    createdAt: timestamp("created_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (table) => [
    index("org_invites_org_id_idx").on(table.orgId),
    index("org_invites_code_idx").on(table.inviteCode),
    index("org_invites_email_idx").on(table.email),
  ],
);

// ── Organization Teams (sub-teams within an org) ─────────────────────

export const orgTeams = pgTable(
  "org_teams",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    orgId: uuid("org_id")
      .references(() => organizations.id, { onDelete: "cascade" })
      .notNull(),
    name: text("name").notNull(),
    description: text("description"),
    color: text("color").default("#6C5CE7"),
    leadId: uuid("lead_id").references(() => profiles.id, {
      onDelete: "set null",
    }),
    isDefault: boolean("is_default").default(false).notNull(),
    createdAt: timestamp("created_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (table) => [
    uniqueIndex("org_teams_org_name_idx").on(table.orgId, table.name),
    index("org_teams_org_id_idx").on(table.orgId),
  ],
);

// ── Organization Team Members ────────────────────────────────────────

export const orgTeamMembers = pgTable(
  "org_team_members",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    orgId: uuid("org_id")
      .references(() => organizations.id, { onDelete: "cascade" })
      .notNull(),
    teamId: uuid("team_id")
      .references(() => orgTeams.id, { onDelete: "cascade" })
      .notNull(),
    userId: uuid("user_id")
      .references(() => profiles.id, { onDelete: "cascade" })
      .notNull(),
    /** lead or member */
    teamRole: text("team_role").default("member").notNull(),
    joinedAt: timestamp("joined_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (table) => [
    uniqueIndex("org_team_members_team_user_idx").on(table.teamId, table.userId),
    index("org_team_members_org_id_idx").on(table.orgId),
  ],
);

// ── Type Exports ─────────────────────────────────────────────────────

export type Organization = typeof organizations.$inferSelect;
export type NewOrganization = typeof organizations.$inferInsert;
export type OrgMembership = typeof orgMemberships.$inferSelect;
export type NewOrgMembership = typeof orgMemberships.$inferInsert;
export type OrgInvite = typeof orgInvites.$inferSelect;
export type NewOrgInvite = typeof orgInvites.$inferInsert;
export type OrgTeam = typeof orgTeams.$inferSelect;
export type NewOrgTeam = typeof orgTeams.$inferInsert;
export type OrgTeamMember = typeof orgTeamMembers.$inferSelect;
export type NewOrgTeamMember = typeof orgTeamMembers.$inferInsert;
