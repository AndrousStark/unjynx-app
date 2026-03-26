// ── MFA Guard Middleware ────────────────────────────────────────────────
// For admin routes, checks if MFA is mandatory for the user's role.
// If MFA is mandatory but not configured, returns 403 with setup URL.
//
// Must be placed after authMiddleware (needs auth context) and after
// the admin role has been resolved.

import { createMiddleware } from "hono/factory";
import { eq } from "drizzle-orm";
import { db } from "../db/index.js";
import { profiles } from "../db/schema/index.js";
import { env } from "../env.js";
import * as mfaService from "../modules/auth/mfa.service.js";

// In-memory cache: logtoId -> { mfaConfigured, expiresAt }
const mfaCache = new Map<
  string,
  { mfaConfigured: boolean; expiresAt: number }
>();
const CACHE_TTL_MS = 3 * 60_000; // 3 minutes

/**
 * Middleware that enforces MFA for admin routes when the user's role
 * requires it (owner, admin).
 *
 * Usage:
 *   adminRoutes.use("/*", authMiddleware);
 *   adminRoutes.use("/*", adminGuard("owner", "admin"));
 *   adminRoutes.use("/*", mfaGuard);
 */
export const mfaGuard = createMiddleware(async (c, next) => {
  const auth = c.get("auth");
  if (!auth) {
    // Should not reach here — authMiddleware should have blocked it
    await next();
    return;
  }

  // Look up the user's admin role
  const [profile] = await db
    .select({ adminRole: profiles.adminRole })
    .from(profiles)
    .where(eq(profiles.id, auth.profileId))
    .limit(1);

  const adminRole = profile?.adminRole ?? null;

  // If MFA is not mandatory for this role, skip the check
  if (!mfaService.requireMfaForRole(adminRole)) {
    await next();
    return;
  }

  // Check cache first
  const cached = mfaCache.get(auth.sub);
  if (cached && Date.now() < cached.expiresAt) {
    if (cached.mfaConfigured) {
      await next();
      return;
    }
    // MFA not configured — block
    return c.json(
      {
        success: false,
        data: null,
        error: "mfa_required",
        setupUrl: `${env.LOGTO_ENDPOINT}/account/mfa`,
      },
      403,
    );
  }

  // Fetch MFA status from Logto
  const methods = await mfaService.getMfaStatus(auth.sub);
  const mfaConfigured = methods.length > 0;

  // Update cache
  mfaCache.set(auth.sub, {
    mfaConfigured,
    expiresAt: Date.now() + CACHE_TTL_MS,
  });

  if (!mfaConfigured) {
    return c.json(
      {
        success: false,
        data: null,
        error: "mfa_required",
        setupUrl: `${env.LOGTO_ENDPOINT}/account/mfa`,
      },
      403,
    );
  }

  await next();
});

/** Clear MFA cache (useful for tests). */
export function clearMfaCache(): void {
  mfaCache.clear();
}
