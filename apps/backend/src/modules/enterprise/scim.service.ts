import crypto from "node:crypto";
import { db } from "../../db/index.js";
import { organizations } from "../../db/schema/index.js";
import { profiles } from "../../db/schema/index.js";
import { orgMemberships } from "../../db/schema/index.js";
import { eq, and } from "drizzle-orm";
import { createLogger } from "../../utils/logger.js";

const log = createLogger("scim");

// ── Token Management ────────────────────────────────────────────────

/** Generate a SCIM bearer token and store its hash. Returns the raw token (shown once). */
export async function generateScimToken(orgId: string): Promise<string> {
  const rawToken = `scim_${crypto.randomBytes(32).toString("hex")}`;
  const hash = crypto.createHash("sha256").update(rawToken).digest("hex");

  await db.update(organizations)
    .set({
      scimEnabled: true,
      scimTokenHash: hash,
      updatedAt: new Date(),
    })
    .where(eq(organizations.id, orgId));

  log.info({ orgId }, "SCIM token generated");
  return rawToken;
}

/** Validate a SCIM bearer token against stored hash. Returns orgId if valid. */
export async function validateScimToken(token: string): Promise<string | null> {
  const hash = crypto.createHash("sha256").update(token).digest("hex");

  const [org] = await db.select({
    id: organizations.id,
    scimEnabled: organizations.scimEnabled,
  })
    .from(organizations)
    .where(eq(organizations.scimTokenHash, hash))
    .limit(1);

  if (!org || !org.scimEnabled) return null;
  return org.id;
}

/** Disable SCIM for an org. */
export async function disableScim(orgId: string): Promise<void> {
  await db.update(organizations)
    .set({
      scimEnabled: false,
      scimTokenHash: null,
      updatedAt: new Date(),
    })
    .where(eq(organizations.id, orgId));

  log.info({ orgId }, "SCIM disabled");
}

// ── SCIM User Operations (RFC 7644) ─────────────────────────────────

interface ScimUser {
  schemas: string[];
  id: string;
  userName: string;
  name: { givenName?: string; familyName?: string; formatted?: string };
  emails: Array<{ value: string; primary?: boolean }>;
  active: boolean;
  meta: { resourceType: string; created: string; lastModified: string };
}

/** Convert a profile to SCIM User representation. */
function toScimUser(profile: {
  id: string;
  email: string | null;
  name: string | null;
  isActive?: boolean;
  createdAt: Date;
  updatedAt: Date;
}): ScimUser {
  const nameParts = (profile.name ?? "").split(" ");
  return {
    schemas: ["urn:ietf:params:scim:schemas:core:2.0:User"],
    id: profile.id,
    userName: profile.email ?? profile.id,
    name: {
      givenName: nameParts[0] ?? "",
      familyName: nameParts.slice(1).join(" ") || undefined,
      formatted: profile.name ?? undefined,
    },
    emails: profile.email
      ? [{ value: profile.email, primary: true }]
      : [],
    active: profile.isActive !== false,
    meta: {
      resourceType: "User",
      created: profile.createdAt.toISOString(),
      lastModified: profile.updatedAt.toISOString(),
    },
  };
}

/** List users in an org (SCIM GET /Users). */
export async function listUsers(
  orgId: string,
  startIndex = 1,
  count = 100,
): Promise<{ totalResults: number; Resources: ScimUser[] }> {
  // Get all members of this org
  const members = await db.select({
    id: profiles.id,
    email: profiles.email,
    name: profiles.name,
    createdAt: profiles.createdAt,
    updatedAt: profiles.updatedAt,
  })
    .from(orgMemberships)
    .innerJoin(profiles, eq(orgMemberships.userId, profiles.id))
    .where(eq(orgMemberships.orgId, orgId))
    .offset(startIndex - 1)
    .limit(count);

  // Update last sync
  await db.update(organizations)
    .set({ scimLastSync: new Date() })
    .where(eq(organizations.id, orgId));

  return {
    totalResults: members.length,
    Resources: members.map(toScimUser),
  };
}

/** Get a single user by profile ID (SCIM GET /Users/:id). */
export async function getUser(
  orgId: string,
  userId: string,
): Promise<ScimUser | null> {
  const [member] = await db.select({
    id: profiles.id,
    email: profiles.email,
    name: profiles.name,
    createdAt: profiles.createdAt,
    updatedAt: profiles.updatedAt,
  })
    .from(orgMemberships)
    .innerJoin(profiles, eq(orgMemberships.userId, profiles.id))
    .where(and(
      eq(orgMemberships.orgId, orgId),
      eq(orgMemberships.userId, userId),
    ))
    .limit(1);

  if (!member) return null;
  return toScimUser(member);
}

/** Deactivate a user (SCIM DELETE /Users/:id or PATCH active=false). */
export async function deactivateUser(
  orgId: string,
  userId: string,
): Promise<boolean> {
  // Remove from org membership (soft deactivation)
  const result = await db.delete(orgMemberships)
    .where(and(
      eq(orgMemberships.orgId, orgId),
      eq(orgMemberships.userId, userId),
    ));

  log.info({ orgId, userId }, "SCIM user deactivated");
  return true;
}
