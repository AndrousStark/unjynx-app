import { createMiddleware } from "hono/factory";
import { HTTPException } from "hono/http-exception";

/**
 * Middleware that blocks access to premium features if the user's email
 * is not verified. Must be used after authMiddleware (requires c.get("auth")).
 *
 * Returns 403 with { error: "email_verification_required" }.
 */
export const emailVerifiedGuard = createMiddleware(async (c, next) => {
  const auth = c.get("auth");

  if (!auth.emailVerified) {
    throw new HTTPException(403, {
      message: JSON.stringify({ error: "email_verification_required" }),
    });
  }

  await next();
});
