import { createMiddleware } from "hono/factory";
import { HTTPException } from "hono/http-exception";

/** 48 hours in milliseconds. */
const VERIFICATION_DEADLINE_MS = 48 * 60 * 60 * 1000;

/**
 * Middleware that blocks access to premium features if the user's email
 * is not verified. Must be used after authMiddleware (requires c.get("auth")).
 *
 * New users get a 48-hour grace period after registration. During this
 * window, they may access features even without email verification.
 * After the deadline, email verification is required.
 *
 * Returns 403 with { error: "email_verification_required" }.
 */
export const emailVerifiedGuard = createMiddleware(async (c, next) => {
  const auth = c.get("auth");

  if (auth.emailVerified) {
    await next();
    return;
  }

  // Allow a 48h grace period for new users — we check account creation time
  // via a lightweight DB lookup (import lazily to avoid circular deps)
  try {
    const { findProfileById } = await import("../modules/auth/auth.repository.js");
    const profile = await findProfileById(auth.profileId);
    if (profile) {
      const accountAge = Date.now() - new Date(profile.createdAt).getTime();
      if (accountAge < VERIFICATION_DEADLINE_MS) {
        // Within grace period — allow access
        await next();
        return;
      }
    }
  } catch {
    // On failure, fall through to require verification (safe default)
  }

  throw new HTTPException(403, {
    message: JSON.stringify({
      error: "email_verification_required",
      deadline: "48h",
    }),
  });
});
