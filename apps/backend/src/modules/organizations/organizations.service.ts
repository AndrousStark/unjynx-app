import crypto from "node:crypto";
import * as orgRepo from "./organizations.repository.js";
import type {
  CreateOrgInput,
  UpdateOrgInput,
  InviteToOrgInput,
  UpdateOrgMemberInput,
} from "./organizations.schema.js";
import type { Organization, OrgMembership, OrgInvite } from "../../db/schema/index.js";
import { logger } from "../../middleware/logger.js";

const log = logger.child({ module: "organizations" });

// ── Organization CRUD ────────────────────────────────────────────────

export async function createOrg(
  ownerId: string,
  input: CreateOrgInput,
): Promise<Organization> {
  // Check slug uniqueness
  const existing = await orgRepo.findOrgBySlug(input.slug);
  if (existing) {
    throw new Error("Organization slug is already taken");
  }

  const org = await orgRepo.createOrg({
    name: input.name,
    slug: input.slug,
    logoUrl: input.logoUrl,
    industryMode: input.industryMode,
    ownerId,
  });

  // Auto-add creator as owner member
  await orgRepo.addMember({
    orgId: org.id,
    userId: ownerId,
    role: "owner",
    status: "active",
  });

  log.info({ orgId: org.id, ownerId, slug: org.slug }, "Organization created");
  return org;
}

export async function getOrg(orgId: string): Promise<Organization | undefined> {
  return orgRepo.findOrgById(orgId);
}

export async function getOrgBySlug(slug: string): Promise<Organization | undefined> {
  return orgRepo.findOrgBySlug(slug);
}

export async function getUserOrgs(userId: string): Promise<readonly Organization[]> {
  return orgRepo.findOrgsByUserId(userId);
}

export async function updateOrg(
  orgId: string,
  input: UpdateOrgInput,
): Promise<Organization> {
  // If slug is changing, check uniqueness
  if (input.slug) {
    const existing = await orgRepo.findOrgBySlug(input.slug);
    if (existing && existing.id !== orgId) {
      throw new Error("Organization slug is already taken");
    }
  }

  const updated = await orgRepo.updateOrg(orgId, {
    name: input.name,
    slug: input.slug,
    logoUrl: input.logoUrl,
    industryMode: input.industryMode,
    settings: input.settings as Organization["settings"],
  });

  if (!updated) throw new Error("Organization not found");

  log.info({ orgId }, "Organization updated");
  return updated;
}

export async function deleteOrg(
  orgId: string,
  actorId: string,
): Promise<void> {
  const org = await orgRepo.findOrgById(orgId);
  if (!org) throw new Error("Organization not found");
  if (org.ownerId !== actorId) throw new Error("Only the owner can delete an organization");

  const deleted = await orgRepo.deleteOrg(orgId);
  if (!deleted) throw new Error("Failed to delete organization");

  log.info({ orgId, actorId }, "Organization deleted");
}

// ── Member Management ────────────────────────────────────────────────

export async function getMembers(orgId: string): Promise<readonly OrgMembership[]> {
  return orgRepo.findMembersByOrgId(orgId);
}

export async function inviteMember(
  orgId: string,
  invitedBy: string,
  input: InviteToOrgInput,
): Promise<OrgInvite> {
  // Check member limit
  const org = await orgRepo.findOrgById(orgId);
  if (!org) throw new Error("Organization not found");

  const memberCount = await orgRepo.countMembers(orgId);
  if (memberCount >= org.maxMembers) {
    throw new Error(`Organization has reached the member limit (${org.maxMembers})`);
  }

  // Generate a 7-day invite code
  const inviteCode = crypto.randomBytes(16).toString("hex");
  const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);

  const invite = await orgRepo.createInvite({
    orgId,
    email: input.email,
    role: input.role,
    inviteCode,
    inviteType: "email",
    invitedBy,
    expiresAt,
  });

  log.info({ orgId, email: input.email, role: input.role }, "Invite created");
  return invite;
}

export async function acceptInvite(
  inviteCode: string,
  userId: string,
): Promise<OrgMembership> {
  const invite = await orgRepo.findInviteByCode(inviteCode);
  if (!invite) throw new Error("Invite not found");
  if (invite.status !== "pending") throw new Error("Invite is no longer valid");
  if (new Date() > invite.expiresAt) {
    await orgRepo.updateInviteStatus(invite.id, "expired");
    throw new Error("Invite has expired");
  }

  // Check if already a member
  const existing = await orgRepo.findMembership(invite.orgId, userId);
  if (existing) {
    await orgRepo.updateInviteStatus(invite.id, "accepted");
    return existing;
  }

  // Add as member
  const member = await orgRepo.addMember({
    orgId: invite.orgId,
    userId,
    role: invite.role,
    status: "active",
    invitedBy: invite.invitedBy,
    invitedAt: invite.createdAt,
  });

  await orgRepo.updateInviteStatus(invite.id, "accepted");

  log.info({ orgId: invite.orgId, userId, role: invite.role }, "Invite accepted");
  return member;
}

export async function updateMemberRole(
  orgId: string,
  targetUserId: string,
  actorId: string,
  input: UpdateOrgMemberInput,
): Promise<OrgMembership> {
  // Cannot change the owner's role
  const org = await orgRepo.findOrgById(orgId);
  if (!org) throw new Error("Organization not found");
  if (org.ownerId === targetUserId) {
    throw new Error("Cannot change the owner's role");
  }

  // Cannot change your own role
  if (actorId === targetUserId) {
    throw new Error("Cannot change your own role");
  }

  const updated = await orgRepo.updateMemberRole(orgId, targetUserId, input.role);
  if (!updated) throw new Error("Member not found");

  log.info({ orgId, targetUserId, newRole: input.role }, "Member role updated");
  return updated;
}

export async function removeMember(
  orgId: string,
  targetUserId: string,
  actorId: string,
): Promise<void> {
  const org = await orgRepo.findOrgById(orgId);
  if (!org) throw new Error("Organization not found");

  // Cannot remove the owner
  if (org.ownerId === targetUserId) {
    throw new Error("Cannot remove the organization owner");
  }

  // Cannot remove yourself (use "leave org" instead)
  if (actorId === targetUserId) {
    throw new Error("Use 'leave organization' to remove yourself");
  }

  const removed = await orgRepo.removeMember(orgId, targetUserId);
  if (!removed) throw new Error("Member not found");

  log.info({ orgId, targetUserId, actorId }, "Member removed");
}

export async function leaveOrg(
  orgId: string,
  userId: string,
): Promise<void> {
  const org = await orgRepo.findOrgById(orgId);
  if (!org) throw new Error("Organization not found");

  // Owner cannot leave (must transfer or delete)
  if (org.ownerId === userId) {
    throw new Error("Owner cannot leave. Transfer ownership or delete the organization.");
  }

  const removed = await orgRepo.removeMember(orgId, userId);
  if (!removed) throw new Error("You are not a member of this organization");

  log.info({ orgId, userId }, "Member left organization");
}

export async function getPendingInvites(orgId: string): Promise<readonly OrgInvite[]> {
  return orgRepo.findPendingInvites(orgId);
}
