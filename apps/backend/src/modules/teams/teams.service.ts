import crypto from "node:crypto";
import type {
  Team,
  TeamMember,
  TeamInvite,
  Standup,
} from "../../db/schema/index.js";
import type {
  CreateTeamInput,
  UpdateTeamInput,
  InviteMemberInput,
  SubmitStandupInput,
  TeamReportsQuery,
} from "./teams.schema.js";
import * as teamRepo from "./teams.repository.js";

// ── Teams ─────────────────────────────────────────────────────────────

export async function createTeam(
  userId: string,
  input: CreateTeamInput,
): Promise<Team> {
  const team = await teamRepo.insertTeam({
    name: input.name,
    ownerId: userId,
    logoUrl: input.logoUrl,
    maxMembers: input.maxMembers,
  });

  // Add creator as owner member
  await teamRepo.insertMember({
    teamId: team.id,
    userId,
    role: "owner",
    status: "active",
  });

  return team;
}

export async function getTeam(
  teamId: string,
): Promise<Team | undefined> {
  return teamRepo.findTeamById(teamId);
}

export async function updateTeam(
  teamId: string,
  input: UpdateTeamInput,
): Promise<Team | undefined> {
  return teamRepo.updateTeam(teamId, input);
}

// ── Members ───────────────────────────────────────────────────────────

export async function getMembers(
  teamId: string,
): Promise<TeamMember[]> {
  return teamRepo.findMembers(teamId);
}

export async function inviteMember(
  teamId: string,
  invitedById: string,
  input: InviteMemberInput,
): Promise<TeamInvite> {
  const team = await teamRepo.findTeamById(teamId);

  if (!team) {
    throw new Error("Team not found");
  }

  const currentCount = await teamRepo.countMembers(teamId);

  if (currentCount >= team.maxMembers) {
    throw new Error("Team has reached maximum member limit");
  }

  const inviteCode = crypto.randomBytes(8).toString("hex");
  const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 days

  return teamRepo.insertInvite({
    teamId,
    email: input.email,
    role: input.role,
    inviteCode,
    expiresAt,
  });
}

export async function updateMemberRole(
  teamId: string,
  userId: string,
  role: "admin" | "member" | "viewer",
): Promise<TeamMember | undefined> {
  const member = await teamRepo.findMember(teamId, userId);

  if (!member) return undefined;

  if (member.role === "owner") {
    throw new Error("Cannot change the owner's role");
  }

  return teamRepo.updateMemberRole(teamId, userId, role);
}

export async function removeMember(
  teamId: string,
  userId: string,
): Promise<boolean> {
  const member = await teamRepo.findMember(teamId, userId);

  if (!member) return false;

  if (member.role === "owner") {
    throw new Error("Cannot remove the team owner");
  }

  return teamRepo.removeMember(teamId, userId);
}

// ── Reports ───────────────────────────────────────────────────────────

export async function getTeamReport(
  teamId: string,
  query: TeamReportsQuery,
): Promise<teamRepo.TeamReport> {
  const now = new Date();
  const sinceDate =
    query.period === "week"
      ? new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)
      : new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

  return teamRepo.getTeamReport(teamId, sinceDate);
}

// ── Standups ──────────────────────────────────────────────────────────

export async function getStandups(
  teamId: string,
  sinceDate?: Date,
  limit?: number,
): Promise<Standup[]> {
  return teamRepo.findStandups(teamId, sinceDate, limit);
}

export async function submitStandup(
  teamId: string,
  userId: string,
  input: SubmitStandupInput,
): Promise<Standup> {
  return teamRepo.insertStandup({
    teamId,
    userId,
    doneYesterday: input.doneYesterday,
    plannedToday: input.plannedToday,
    blockers: input.blockers,
  });
}
