import * as jose from "jose";
import { eq, and, gte, desc } from "drizzle-orm";
import { db } from "../../db/index.js";
import {
  impersonationSessions,
  profiles,
  type ImpersonationSession,
} from "../../db/schema/index.js";
import { env } from "../../env.js";
import { logger } from "../../middleware/logger.js";

const log = logger.child({ module: "impersonation" });

// ── Constants ────────────────────────────────────────────────────────

/** Impersonation tokens expire after 1 hour (maximum). */
const MAX_TTL_SECONDS = 3600;

/** Encode the JWT secret to bytes once. */
function getSecretKey(): Uint8Array {
  return new TextEncoder().encode(env.JWT_SECRET);
}

// ── Token Hash Utility ──────────────────────────────────────────────

async function hashToken(token: string): Promise<string> {
  const data = new TextEncoder().encode(token);
  const hashBuffer = await crypto.subtle.digest("SHA-256", data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map((b) => b.toString(16).padStart(2, "0")).join("");
}

// ── Resolve Admin Role Helper ───────────────────────────────────────

async function resolveAdminRole(
  userId: string,
): Promise<string | null> {
  const [profile] = await db
    .select({ adminRole: profiles.adminRole })
    .from(profiles)
    .where(eq(profiles.id, userId))
    .limit(1);

  return profile?.adminRole ?? null;
}

// ── Service Functions ───────────────────────────────────────────────

export interface ImpersonationTokenResult {
  readonly token: string;
  readonly sessionId: string;
  readonly expiresAt: Date;
}

/**
 * Generate a short-lived impersonation JWT.
 *
 * The JWT carries dual identity:
 *   { sub: targetUserId, actor: adminId, type: "impersonation" }
 *
 * Restrictions:
 * - Cannot impersonate another owner.
 * - Cannot impersonate self.
 */
export async function generateImpersonationToken(
  adminId: string,
  targetUserId: string,
  reason: string,
): Promise<ImpersonationTokenResult> {
  // Guard: cannot impersonate self
  if (adminId === targetUserId) {
    throw new Error("Cannot impersonate yourself");
  }

  // Guard: target must exist
  const [target] = await db
    .select({ id: profiles.id, adminRole: profiles.adminRole })
    .from(profiles)
    .where(eq(profiles.id, targetUserId))
    .limit(1);

  if (!target) {
    throw new Error("Target user not found");
  }

  // Guard: cannot impersonate another owner
  if (target.adminRole === "owner") {
    throw new Error("Cannot impersonate an owner account");
  }

  // Build JWT
  const expiresAt = new Date(Date.now() + MAX_TTL_SECONDS * 1000);

  const token = await new jose.SignJWT({
    sub: targetUserId,
    actor: adminId,
    type: "impersonation",
  })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime(expiresAt)
    .setJti(crypto.randomUUID())
    .sign(getSecretKey());

  // Hash token for DB storage (never store raw tokens)
  const tokenHashValue = await hashToken(token);

  // Persist session
  const [session] = await db
    .insert(impersonationSessions)
    .values({
      adminId,
      targetUserId,
      tokenHash: tokenHashValue,
      reason,
      expiresAt,
    })
    .returning();

  log.info(
    { adminId, targetUserId, sessionId: session.id, reason },
    "Impersonation token generated",
  );

  return {
    token,
    sessionId: session.id,
    expiresAt,
  };
}

/**
 * Validate an impersonation JWT.
 *
 * Verifies:
 * 1. JWT signature and expiry
 * 2. Token type is "impersonation"
 * 3. Session exists in DB and is not revoked
 */
export interface ValidatedImpersonation {
  readonly targetUserId: string;
  readonly adminId: string;
  readonly sessionId: string;
}

export async function validateImpersonationToken(
  token: string,
): Promise<ValidatedImpersonation> {
  // Step 1: Verify JWT signature and expiry
  let payload: jose.JWTPayload;
  try {
    const result = await jose.jwtVerify(token, getSecretKey());
    payload = result.payload;
  } catch {
    throw new Error("Invalid or expired impersonation token");
  }

  // Step 2: Verify token type
  if (payload.type !== "impersonation") {
    throw new Error("Token is not an impersonation token");
  }

  const targetUserId = payload.sub as string;
  const adminId = payload.actor as string;

  if (!targetUserId || !adminId) {
    throw new Error("Malformed impersonation token");
  }

  // Step 3: Check DB session is not revoked
  const tokenHashValue = await hashToken(token);
  const [session] = await db
    .select()
    .from(impersonationSessions)
    .where(
      and(
        eq(impersonationSessions.tokenHash, tokenHashValue),
        eq(impersonationSessions.isRevoked, false),
        gte(impersonationSessions.expiresAt, new Date()),
      ),
    )
    .limit(1);

  if (!session) {
    throw new Error("Impersonation session not found or has been revoked");
  }

  return {
    targetUserId,
    adminId,
    sessionId: session.id,
  };
}

/**
 * Revoke an impersonation session by session ID.
 * Only the admin who created it (or any owner) can revoke.
 */
export async function revokeImpersonation(
  actorId: string,
  sessionId: string,
): Promise<boolean> {
  // Check if actor is an owner (owners can revoke any session)
  const actorRole = await resolveAdminRole(actorId);
  const isOwner = actorRole === "owner";

  // Build condition: either the actor created the session or is an owner
  const conditions = isOwner
    ? eq(impersonationSessions.id, sessionId)
    : and(
        eq(impersonationSessions.id, sessionId),
        eq(impersonationSessions.adminId, actorId),
      );

  const [updated] = await db
    .update(impersonationSessions)
    .set({ isRevoked: true, revokedAt: new Date() })
    .where(conditions)
    .returning();

  if (updated) {
    log.info(
      { actorId, sessionId, adminId: updated.adminId, targetUserId: updated.targetUserId },
      "Impersonation session revoked",
    );
  }

  return !!updated;
}

/**
 * List all active (non-revoked, non-expired) impersonation sessions.
 * For super admin audit purposes.
 */
export async function listActiveImpersonations(): Promise<
  readonly ImpersonationSession[]
> {
  return db
    .select()
    .from(impersonationSessions)
    .where(
      and(
        eq(impersonationSessions.isRevoked, false),
        gte(impersonationSessions.expiresAt, new Date()),
      ),
    )
    .orderBy(desc(impersonationSessions.createdAt));
}
