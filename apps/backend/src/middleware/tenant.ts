// ── Tenant Middleware ─────────────────────────────────────────────────
//
// Extracts organization context from the request and sets it for RLS.
// Must run AFTER authMiddleware (needs profileId).
//
// Org resolution order:
//   1. X-Org-Id header (explicit org selection from frontend)
//   2. Logto organization_id claim (from org-scoped token)
//   3. null (personal workspace — no org scoping)
//
// When orgId is set:
//   - Validates user is a member of that org
//   - Caches membership in Valkey (5-min TTL)
//   - Sets `app.current_org_id` via SET LOCAL for PostgreSQL RLS
//   - Attaches orgId + orgRole to request context

import { createMiddleware } from "hono/factory";
import { HTTPException } from "hono/http-exception";
import { eq, and } from "drizzle-orm";
import { db } from "../db/index.js";
import { orgMemberships } from "../db/schema/index.js";
import { logger } from "./logger.js";
import { sql } from "drizzle-orm";

const log = logger.child({ module: "tenant" });

// ── Types ────────────────────────────────────────────────────────────

type OrgRole = "owner" | "admin" | "manager" | "member" | "viewer" | "guest";

export interface TenantContext {
  /** Organization ID (null = personal workspace). */
  readonly orgId: string | null;
  /** User's role within the organization. */
  readonly orgRole: OrgRole | null;
}

declare module "hono" {
  interface ContextVariableMap {
    tenant: TenantContext;
  }
}

// ── Membership Cache ─────────────────────────────────────────────────

const membershipCache = new Map<
  string,
  { role: OrgRole; expiresAt: number }
>();
const MEMBERSHIP_CACHE_TTL_MS = 5 * 60_000; // 5 minutes

function cacheKey(userId: string, orgId: string): string {
  return `${userId}:${orgId}`;
}

/** Clear membership cache for a user (call on role change, org leave, etc.) */
export function clearMembershipCache(userId?: string): void {
  if (!userId) {
    membershipCache.clear();
    return;
  }
  for (const key of membershipCache.keys()) {
    if (key.startsWith(`${userId}:`)) {
      membershipCache.delete(key);
    }
  }
}

// ── Membership Validation ────────────────────────────────────────────

async function validateMembership(
  userId: string,
  orgId: string,
): Promise<OrgRole | null> {
  const key = cacheKey(userId, orgId);
  const cached = membershipCache.get(key);
  if (cached && Date.now() < cached.expiresAt) {
    return cached.role;
  }

  const [membership] = await db
    .select({ role: orgMemberships.role })
    .from(orgMemberships)
    .where(
      and(
        eq(orgMemberships.orgId, orgId),
        eq(orgMemberships.userId, userId),
        eq(orgMemberships.status, "active"),
      ),
    )
    .limit(1);

  if (!membership) {
    return null;
  }

  const role = membership.role as OrgRole;
  membershipCache.set(key, {
    role,
    expiresAt: Date.now() + MEMBERSHIP_CACHE_TTL_MS,
  });

  return role;
}

// ── Middleware ────────────────────────────────────────────────────────

/**
 * Tenant middleware — extracts org context and sets PostgreSQL RLS variable.
 *
 * Usage in routes:
 *   app.use("*", authMiddleware);
 *   app.use("*", tenantMiddleware);
 *
 *   // In route handler:
 *   const { orgId, orgRole } = c.get("tenant");
 */
export const tenantMiddleware = createMiddleware(async (c, next) => {
  const auth = c.get("auth");

  // Extract org ID from request
  const orgId =
    c.req.header("X-Org-Id") ??
    (c.req.query("orgId") as string | undefined) ??
    null;

  if (!orgId) {
    // Personal workspace — no org scoping
    c.set("tenant", { orgId: null, orgRole: null });
    await next();
    return;
  }

  // Validate UUID format (prevent injection)
  const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
  if (!UUID_RE.test(orgId)) {
    throw new HTTPException(400, { message: "Invalid organization ID format" });
  }

  // Validate user is a member of this org
  const orgRole = await validateMembership(auth.profileId, orgId);
  if (!orgRole) {
    log.warn(
      { userId: auth.profileId, orgId },
      "Access denied: not a member of this organization",
    );
    throw new HTTPException(403, {
      message: "You are not a member of this organization",
    });
  }

  c.set("tenant", { orgId, orgRole });

  await next();
});

// ── RLS Helper ───────────────────────────────────────────────────────

/**
 * Set the PostgreSQL RLS variable for the current org.
 * Call this inside a transaction before any org-scoped query.
 *
 * Usage:
 *   await db.transaction(async (tx) => {
 *     await setOrgContext(tx, orgId);
 *     // All subsequent queries in this transaction are org-scoped
 *     const tasks = await tx.select().from(tasks);
 *   });
 *
 * IMPORTANT: Uses SET LOCAL (transaction-scoped, PgBouncer-safe).
 * Never use SET (session-scoped) — it persists beyond the transaction.
 */
export async function setOrgContext(
  tx: Parameters<Parameters<typeof db.transaction>[0]>[0],
  orgId: string | null,
): Promise<void> {
  if (orgId) {
    await tx.execute(sql`SET LOCAL app.current_org_id = ${orgId}`);
  }
}

// ── Role Checking Utilities ──────────────────────────────────────────

const ROLE_HIERARCHY: Record<OrgRole, number> = {
  owner: 60,
  admin: 50,
  manager: 40,
  member: 30,
  viewer: 20,
  guest: 10,
};

/**
 * Check if a user's org role meets the minimum required level.
 *
 * Usage:
 *   if (!hasOrgRole(orgRole, "admin")) throw 403;
 */
export function hasOrgRole(
  userRole: OrgRole | null,
  minimumRole: OrgRole,
): boolean {
  if (!userRole) return false;
  return ROLE_HIERARCHY[userRole] >= ROLE_HIERARCHY[minimumRole];
}

/**
 * Middleware factory for role-gated routes.
 *
 * Usage:
 *   app.post("/projects", requireOrgRole("member"), async (c) => { ... });
 */
export function requireOrgRole(minimumRole: OrgRole) {
  return createMiddleware(async (c, next) => {
    const tenant = c.get("tenant");

    if (!tenant.orgId) {
      throw new HTTPException(400, {
        message: "Organization context required for this operation",
      });
    }

    if (!hasOrgRole(tenant.orgRole, minimumRole)) {
      throw new HTTPException(403, {
        message: `Requires ${minimumRole} role or higher in this organization`,
      });
    }

    await next();
  });
}
