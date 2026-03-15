import { createMiddleware } from "hono/factory";
import { HTTPException } from "hono/http-exception";
import { eq } from "drizzle-orm";
import { db } from "../db/index.js";
import { profiles } from "../db/schema/index.js";

type AdminRole = "super_admin" | "dev_admin";

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
