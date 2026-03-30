import { createMiddleware } from "hono/factory";
import { HTTPException } from "hono/http-exception";
import { eq } from "drizzle-orm";
import * as jose from "jose";
import { env } from "../env.js";
import { upsertProfile } from "../modules/auth/auth.repository.js";
import { db } from "../db/index.js";
import { featureFlags, profiles } from "../db/schema/index.js";
import { logger } from "./logger.js";

const log = logger.child({ module: "auth" });

interface AuthPayload {
  readonly sub: string;
  readonly profileId: string;
  readonly email?: string;
  readonly name?: string;
  readonly emailVerified: boolean;
  /** User's admin role from the profiles table. */
  readonly adminRole: "owner" | "admin" | "member" | "viewer" | "guest";
  /** JWT scopes from Logto RBAC (space-delimited in JWT, parsed to array). */
  readonly scopes: readonly string[];
  /** Set when an admin is impersonating this user. Contains the admin's profile ID. */
  readonly impersonatedBy?: string;
}

declare module "hono" {
  interface ContextVariableMap {
    auth: AuthPayload;
  }
}

let jwks: ReturnType<typeof jose.createRemoteJWKSet>;

function getJwks() {
  if (!jwks) {
    const jwksUrl = new URL("/oidc/jwks", env.LOGTO_ENDPOINT);
    jwks = jose.createRemoteJWKSet(jwksUrl);
  }
  return jwks;
}

// In-memory cache: logtoId -> { profileId, emailVerified, adminRole, expiresAt }
type AdminRole = "owner" | "admin" | "member" | "viewer" | "guest";

const profileCache = new Map<
  string,
  { profileId: string; emailVerified: boolean; adminRole: AdminRole; expiresAt: number }
>();
const CACHE_TTL_MS = 5 * 60_000; // 5 minutes

async function resolveProfile(
  logtoId: string,
  email?: string,
  name?: string,
  picture?: string,
): Promise<{ profileId: string; emailVerified: boolean; adminRole: AdminRole }> {
  const cached = profileCache.get(logtoId);
  if (cached && Date.now() < cached.expiresAt) {
    return { profileId: cached.profileId, emailVerified: cached.emailVerified, adminRole: cached.adminRole };
  }

  // Upsert ensures the profile always exists.
  // On first login, picture (from Google/social sign-in) seeds avatarUrl.
  const profile = await upsertProfile({ logtoId, email, name, picture });

  // Fetch adminRole from the profiles table (not included in upsert return)
  const [fullProfile] = await db
    .select({ adminRole: profiles.adminRole })
    .from(profiles)
    .where(eq(profiles.id, profile.id))
    .limit(1);

  const adminRole: AdminRole = (fullProfile?.adminRole as AdminRole) ?? "member";

  profileCache.set(logtoId, {
    profileId: profile.id,
    emailVerified: profile.emailVerified,
    adminRole,
    expiresAt: Date.now() + CACHE_TTL_MS,
  });

  return { profileId: profile.id, emailVerified: profile.emailVerified, adminRole };
}

/** Clear the profile cache (useful when email verification status changes). */
export function clearProfileCache(): void {
  profileCache.clear();
}

// ── Panic Mode Cache ────────────────────────────────────────────────

let panicModeCache: { active: boolean; expiresAt: number } | null = null;
const PANIC_CACHE_TTL_MS = 10_000; // 10 seconds — short TTL for security

async function isPanicModeActive(): Promise<boolean> {
  if (panicModeCache && Date.now() < panicModeCache.expiresAt) {
    return panicModeCache.active;
  }

  const [flag] = await db
    .select({ status: featureFlags.status })
    .from(featureFlags)
    .where(eq(featureFlags.key, "panic_mode"))
    .limit(1);

  const active = flag?.status === "enabled";
  panicModeCache = { active, expiresAt: Date.now() + PANIC_CACHE_TTL_MS };
  return active;
}

/** Check if a profile ID belongs to an owner. */
async function isOwnerProfile(profileId: string): Promise<boolean> {
  const [profile] = await db
    .select({ adminRole: profiles.adminRole })
    .from(profiles)
    .where(eq(profiles.id, profileId))
    .limit(1);

  return profile?.adminRole === "owner";
}

// ── Impersonation Token Helper ──────────────────────────────────────

function getImpersonationSecretKey(): Uint8Array {
  return new TextEncoder().encode(env.JWT_SECRET);
}

interface ImpersonationPayload {
  readonly targetUserId: string;
  readonly adminId: string;
}

/**
 * Try to decode a token as an impersonation JWT (HS256, signed with JWT_SECRET).
 * Returns null if the token is not an impersonation token.
 */
async function tryDecodeImpersonationToken(
  token: string,
): Promise<ImpersonationPayload | null> {
  try {
    const { payload } = await jose.jwtVerify(token, getImpersonationSecretKey());

    if (payload.type !== "impersonation") {
      return null;
    }

    const targetUserId = payload.sub as string | undefined;
    const adminId = payload.actor as string | undefined;

    if (!targetUserId || !adminId) {
      return null;
    }

    return { targetUserId, adminId };
  } catch {
    // Not an impersonation token or invalid — return null
    return null;
  }
}

// ── Main Auth Middleware ─────────────────────────────────────────────

export const authMiddleware = createMiddleware(async (c, next) => {
  const authHeader = c.req.header("Authorization");

  if (!authHeader?.startsWith("Bearer ")) {
    throw new HTTPException(401, { message: "Missing or invalid token" });
  }

  const token = authHeader.slice(7);

  // ── Attempt 1: Check if this is an impersonation token (HS256) ────
  const impersonation = await tryDecodeImpersonationToken(token);
  if (impersonation) {
    // Validate the session is still active via the impersonation service
    // (lazy import to avoid circular dependencies)
    const { validateImpersonationToken } = await import(
      "../modules/admin/impersonation.service.js"
    );

    try {
      const validated = await validateImpersonationToken(token);

      // Resolve the TARGET user's profile
      const [targetProfile] = await db
        .select()
        .from(profiles)
        .where(eq(profiles.id, validated.targetUserId))
        .limit(1);

      if (!targetProfile) {
        throw new HTTPException(401, { message: "Impersonated user not found" });
      }

      // Set auth context with target user's identity + actor (admin) annotation
      // Impersonation tokens have no JWT scopes — restricted by design
      c.set("auth", {
        sub: targetProfile.logtoId,
        profileId: targetProfile.id,
        email: targetProfile.email ?? undefined,
        name: targetProfile.name ?? undefined,
        emailVerified: targetProfile.emailVerified,
        adminRole: (targetProfile.adminRole as AdminRole) ?? "member",
        scopes: [],
        impersonatedBy: validated.adminId,
      });

      await next();
      return;
    } catch {
      throw new HTTPException(401, { message: "Invalid or expired impersonation token" });
    }
  }

  // ── Attempt 2: Standard Logto OIDC token (RS256 via JWKS) ────────

  let sub: string;
  let email: string | undefined;
  let name: string | undefined;
  let picture: string | undefined;
  let jwtScopes: readonly string[] = [];

  try {
    const { payload } = await jose.jwtVerify(token, getJwks(), {
      issuer: `${env.LOGTO_ENDPOINT}/oidc`,
      // Audience validation: Logto tokens include the app ID as audience.
      // If LOGTO_APP_ID is configured, enforce it; otherwise skip
      // (backward compat for dev environments without the env var).
      audience: env.LOGTO_APP_ID || undefined,
    });
    sub = payload.sub!;
    email = payload.email as string | undefined;
    name = payload.name as string | undefined;
    picture = payload.picture as string | undefined;

    // Extract scopes from JWT (Logto RBAC places them in the "scope" claim)
    const scopeClaim = payload.scope as string | undefined;
    jwtScopes = scopeClaim ? scopeClaim.split(" ").filter(Boolean) : [];
  } catch (err) {
    const errorMessage = (err as Error).message;
    const errorCode = (err as { code?: string }).code;
    // Log minimal info — never log the token itself
    log.error({ errorMessage, errorCode }, "JWT verify failed");
    throw new HTTPException(401, { message: "Invalid or expired token" });
  }

  // Resolve logtoId -> profileId + emailVerified + adminRole (cached, upserts on first encounter)
  const { profileId, emailVerified, adminRole } = await resolveProfile(sub, email, name, picture);

  // ── Panic Mode Check ──────────────────────────────────────────────
  // During panic mode, only owner accounts can access the system.
  // Non-owner users receive 503 Service Unavailable.
  const panicActive = await isPanicModeActive();
  if (panicActive) {
    const isOwner = await isOwnerProfile(profileId);
    if (!isOwner) {
      throw new HTTPException(503, {
        message:
          "UNJYNX is temporarily locked for security. Please contact support.",
      });
    }
  }

  c.set("auth", { sub, profileId, email, name, emailVerified, adminRole, scopes: jwtScopes });

  await next();
});
