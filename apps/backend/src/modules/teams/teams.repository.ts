import { eq, and, desc, count, gte } from "drizzle-orm";
import { db } from "../../db/index.js";
import {
  teams,
  teamMembers,
  teamInvites,
  standups,
  tasks,
  type Team,
  type NewTeam,
  type TeamMember,
  type NewTeamMember,
  type TeamInvite,
  type NewTeamInvite,
  type Standup,
  type NewStandup,
} from "../../db/schema/index.js";

// ── Teams ─────────────────────────────────────────────────────────────

export async function insertTeam(data: NewTeam): Promise<Team> {
  const [created] = await db.insert(teams).values(data).returning();
  return created;
}

export async function findTeamById(teamId: string): Promise<Team | undefined> {
  const [team] = await db
    .select()
    .from(teams)
    .where(eq(teams.id, teamId))
    .limit(1);

  return team;
}

export async function updateTeam(
  teamId: string,
  data: Partial<Omit<Team, "id" | "createdAt">>,
): Promise<Team | undefined> {
  const [updated] = await db
    .update(teams)
    .set({ ...data, updatedAt: new Date() })
    .where(eq(teams.id, teamId))
    .returning();

  return updated;
}

// ── Members ───────────────────────────────────────────────────────────

export async function insertMember(
  data: NewTeamMember,
): Promise<TeamMember> {
  const [created] = await db
    .insert(teamMembers)
    .values(data)
    .returning();

  return created;
}

export async function findMembers(
  teamId: string,
): Promise<TeamMember[]> {
  return db
    .select()
    .from(teamMembers)
    .where(eq(teamMembers.teamId, teamId))
    .orderBy(teamMembers.joinedAt);
}

export async function findMember(
  teamId: string,
  userId: string,
): Promise<TeamMember | undefined> {
  const [member] = await db
    .select()
    .from(teamMembers)
    .where(
      and(eq(teamMembers.teamId, teamId), eq(teamMembers.userId, userId)),
    )
    .limit(1);

  return member;
}

export async function countMembers(teamId: string): Promise<number> {
  const [{ total }] = await db
    .select({ total: count() })
    .from(teamMembers)
    .where(
      and(eq(teamMembers.teamId, teamId), eq(teamMembers.status, "active")),
    );

  return total;
}

export async function updateMemberRole(
  teamId: string,
  userId: string,
  role: "owner" | "admin" | "member" | "viewer",
): Promise<TeamMember | undefined> {
  const [updated] = await db
    .update(teamMembers)
    .set({ role })
    .where(
      and(eq(teamMembers.teamId, teamId), eq(teamMembers.userId, userId)),
    )
    .returning();

  return updated;
}

export async function removeMember(
  teamId: string,
  userId: string,
): Promise<boolean> {
  const result = await db
    .delete(teamMembers)
    .where(
      and(eq(teamMembers.teamId, teamId), eq(teamMembers.userId, userId)),
    )
    .returning({ id: teamMembers.id });

  return result.length > 0;
}

// ── Invites ───────────────────────────────────────────────────────────

export async function insertInvite(
  data: NewTeamInvite,
): Promise<TeamInvite> {
  const [created] = await db
    .insert(teamInvites)
    .values(data)
    .returning();

  return created;
}

export async function findInviteByCode(
  code: string,
): Promise<TeamInvite | undefined> {
  const [invite] = await db
    .select()
    .from(teamInvites)
    .where(eq(teamInvites.inviteCode, code))
    .limit(1);

  return invite;
}

// ── Standups ──────────────────────────────────────────────────────────

export async function insertStandup(
  data: NewStandup,
): Promise<Standup> {
  const [created] = await db
    .insert(standups)
    .values(data)
    .returning();

  return created;
}

export async function findStandups(
  teamId: string,
  sinceDate?: Date,
  limit: number = 20,
): Promise<Standup[]> {
  const conditions = sinceDate
    ? and(eq(standups.teamId, teamId), gte(standups.submittedAt, sinceDate))
    : eq(standups.teamId, teamId);

  return db
    .select()
    .from(standups)
    .where(conditions)
    .orderBy(desc(standups.submittedAt))
    .limit(limit);
}

// ── Reports ───────────────────────────────────────────────────────────

export interface TeamReport {
  readonly memberCount: number;
  readonly totalTasks: number;
  readonly completedTasks: number;
  readonly completionRate: number;
}

export async function getTeamReport(
  teamId: string,
  sinceDate: Date,
): Promise<TeamReport> {
  const members = await findMembers(teamId);
  const memberIds = members.map((m) => m.userId);

  if (memberIds.length === 0) {
    return { memberCount: 0, totalTasks: 0, completedTasks: 0, completionRate: 0 };
  }

  // For now, return member count. Full implementation requires access to tasks per user.
  const memberCount = memberIds.length;

  return {
    memberCount,
    totalTasks: 0,
    completedTasks: 0,
    completionRate: 0,
  };
}
