import { createMiddleware } from "hono/factory";

/**
 * Middleware factory: gate a route behind one or more JWT scopes.
 *
 * If the user's JWT (from Logto RBAC) does not contain ALL required scopes,
 * returns 403 with a descriptive error.
 *
 * Usage:
 *   app.post("/tasks", scopeGuard("tasks:create"), handler)
 *   app.delete("/admin/users/:id", scopeGuard("admin:manage"), handler)
 *
 * Scopes are populated in auth.scopes by the auth middleware from the
 * JWT "scope" claim (space-delimited string from Logto).
 *
 * IMPORTANT: This middleware is OPTIONAL and complementary to the
 * access-gate middleware. Use it for routes where you want JWT-level
 * enforcement in addition to the 3-layer plan/role/flag checks.
 * If scopes array is empty (e.g., Logto RBAC not yet configured),
 * the middleware passes through — fail-open to avoid blocking
 * during gradual rollout.
 */
export function scopeGuard(...requiredScopes: string[]) {
  return createMiddleware(async (c, next) => {
    const auth = c.get("auth");
    const userScopes = auth.scopes;

    // Fail-open: if no scopes in JWT (RBAC not configured yet), allow through
    // The 3-layer access-gate provides the primary enforcement
    if (userScopes.length === 0) {
      await next();
      return;
    }

    const missing = requiredScopes.filter(
      (scope) => !userScopes.includes(scope),
    );

    if (missing.length > 0) {
      return c.json(
        {
          success: false,
          data: null,
          error: `Insufficient permissions. Missing scopes: ${missing.join(", ")}`,
          requiredScopes: requiredScopes,
        },
        403,
      );
    }

    await next();
  });
}
