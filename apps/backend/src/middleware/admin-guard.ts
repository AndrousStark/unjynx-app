import { createMiddleware } from "hono/factory";
import { HTTPException } from "hono/http-exception";
import { eq } from "drizzle-orm";
import { db } from "../db/index.js";
import { profiles, auditLog } from "../db/schema/index.js";

type AdminRole = "owner" | "admin" | "member" | "viewer" | "guest";

// In-memory cache: userId -> { role, expiresAt }
const adminCache = new Map<string, { role: string | null; expiresAt: number }>();
const CACHE_TTL_MS = 2 * 60_000; // 2 minutes

async function resolveAdminRole(userId: string): Promise<string | null> {
  const cached = adminCache.get(userId);
  if (cached && Date.now() < cached.expiresAt) {
    return cached.role;
  }

  const [profile] = await db
    .select()
    .from(profiles)
    .where(eq(profiles.id, userId))
    .limit(1);

  // Role stored as part of profile metadata or a dedicated admin column
  // For now we check a simple convention: profiles with specific emails are admins
  const role: string | null = (profile as Record<string, unknown>)?.adminRole as string | null ?? null;

  adminCache.set(userId, {
    role,
    expiresAt: Date.now() + CACHE_TTL_MS,
  });

  return role;
}

/**
 * Middleware that restricts access to admin routes.
 * Must be used after authMiddleware.
 */
export function adminGuard(...allowedRoles: AdminRole[]) {
  return createMiddleware(async (c, next) => {
    const userId = c.get("auth").profileId;
    const role = await resolveAdminRole(userId);

    if (!role || !allowedRoles.includes(role as AdminRole)) {
      // Audit log: record failed admin access attempt (fire-and-forget)
      db.insert(auditLog)
        .values({
          userId,
          action: "admin.access_denied",
          entityType: "admin_guard",
          metadata: JSON.stringify({
            requiredRoles: allowedRoles,
            actualRole: role ?? "none",
            path: c.req.path,
            method: c.req.method,
          }),
          ipAddress:
            c.req.header("x-forwarded-for") ??
            c.req.header("x-real-ip") ??
            undefined,
          userAgent: c.req.header("user-agent") ?? undefined,
        })
        .execute()
        .catch(() => {
          // Non-critical: don't block the response if audit insert fails
        });

      throw new HTTPException(403, {
        message: "Admin access required",
      });
    }

    await next();
  });
}

/** Clear the admin cache (useful in tests). */
export function clearAdminCache(): void {
  adminCache.clear();
}
