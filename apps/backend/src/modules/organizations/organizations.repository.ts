import { eq, and, desc } from "drizzle-orm";
import { db } from "../../db/index.js";
import {
  organizations,
  orgMemberships,
  orgInvites,
  type Organization,
  type OrgMembership,
  type OrgInvite,
} from "../../db/schema/index.js";

// ── Organizations ────────────────────────────────────────────────────

export async function createOrg(
  data: typeof organizations.$inferInsert,
): Promise<Organization> {
  const [org] = await db.insert(organizations).values(data).returning();
  return org;
}

export async function findOrgById(id: string): Promise<Organization | undefined> {
  const [org] = await db
    .select()
    .from(organizations)
    .where(eq(organizations.id, id))
    .limit(1);
  return org;
}

export async function findOrgBySlug(slug: string): Promise<Organization | undefined> {
  const [org] = await db
    .select()
    .from(organizations)
    .where(eq(organizations.slug, slug))
    .limit(1);
  return org;
}

export async function findOrgsByUserId(userId: string): Promise<readonly Organization[]> {
  const rows = await db
    .select({ org: organizations, role: orgMemberships.role })
    .from(orgMemberships)
    .innerJoin(organizations, eq(orgMemberships.orgId, organizations.id))
    .where(
      and(
        eq(orgMemberships.userId, userId),
        eq(orgMemberships.status, "active"),
        eq(organizations.isActive, true),
      ),
    )
    .orderBy(desc(orgMemberships.lastActiveAt));

  return rows.map((r) => r.org);
}

export async function updateOrg(
  id: string,
  data: Partial<Pick<Organization, "name" | "slug" | "logoUrl" | "industryMode" | "settings" | "plan" | "maxMembers" | "maxProjects" | "isActive">>,
): Promise<Organization | undefined> {
  const [updated] = await db
    .update(organizations)
    .set({ ...data, updatedAt: new Date() })
    .where(eq(organizations.id, id))
    .returning();
  return updated;
}

export async function deleteOrg(id: string): Promise<boolean> {
  const [deleted] = await db
    .delete(organizations)
    .where(eq(organizations.id, id))
    .returning({ id: organizations.id });
  return !!deleted;
}

// ── Members ──────────────────────────────────────────────────────────

export async function addMember(
  data: typeof orgMemberships.$inferInsert,
): Promise<OrgMembership> {
  const [member] = await db.insert(orgMemberships).values(data).returning();
  return member;
}

export async function findMembersByOrgId(orgId: string): Promise<readonly OrgMembership[]> {
  return db
    .select()
    .from(orgMemberships)
    .where(
      and(
        eq(orgMemberships.orgId, orgId),
        eq(orgMemberships.status, "active"),
      ),
    )
    .orderBy(orgMemberships.joinedAt);
}

export async function findMembership(
  orgId: string,
  userId: string,
): Promise<OrgMembership | undefined> {
  const [row] = await db
    .select()
    .from(orgMemberships)
    .where(
      and(eq(orgMemberships.orgId, orgId), eq(orgMemberships.userId, userId)),
    )
    .limit(1);
  return row;
}

export async function updateMemberRole(
  orgId: string,
  userId: string,
  role: OrgMembership["role"],
): Promise<OrgMembership | undefined> {
  const [updated] = await db
    .update(orgMemberships)
    .set({ role })
    .where(
      and(eq(orgMemberships.orgId, orgId), eq(orgMemberships.userId, userId)),
    )
    .returning();
  return updated;
}

export async function removeMember(
  orgId: string,
  userId: string,
): Promise<boolean> {
  const [deleted] = await db
    .delete(orgMemberships)
    .where(
      and(eq(orgMemberships.orgId, orgId), eq(orgMemberships.userId, userId)),
    )
    .returning({ id: orgMemberships.id });
  return !!deleted;
}

export async function countMembers(orgId: string): Promise<number> {
  const rows = await db
    .select({ id: orgMemberships.id })
    .from(orgMemberships)
    .where(
      and(
        eq(orgMemberships.orgId, orgId),
        eq(orgMemberships.status, "active"),
      ),
    );
  return rows.length;
}

// ── Invites ──────────────────────────────────────────────────────────

export async function createInvite(
  data: typeof orgInvites.$inferInsert,
): Promise<OrgInvite> {
  const [invite] = await db.insert(orgInvites).values(data).returning();
  return invite;
}

export async function findInviteByCode(code: string): Promise<OrgInvite | undefined> {
  const [invite] = await db
    .select()
    .from(orgInvites)
    .where(eq(orgInvites.inviteCode, code))
    .limit(1);
  return invite;
}

export async function findPendingInvites(orgId: string): Promise<readonly OrgInvite[]> {
  return db
    .select()
    .from(orgInvites)
    .where(
      and(
        eq(orgInvites.orgId, orgId),
        eq(orgInvites.status, "pending"),
      ),
    )
    .orderBy(desc(orgInvites.createdAt));
}

export async function updateInviteStatus(
  id: string,
  status: OrgInvite["status"],
): Promise<OrgInvite | undefined> {
  const [updated] = await db
    .update(orgInvites)
    .set({
      status,
      acceptedAt: status === "accepted" ? new Date() : undefined,
    })
    .where(eq(orgInvites.id, id))
    .returning();
  return updated;
}
