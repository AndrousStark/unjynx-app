import { createMiddleware } from "hono/factory";
import { HTTPException } from "hono/http-exception";
import { eq, and } from "drizzle-orm";
import { db } from "../db/index.js";
import { subscriptions } from "../db/schema/index.js";

type Plan = "free" | "pro" | "team" | "enterprise";

// In-memory cache: userId -> { plan, expiresAt }
const planCache = new Map<string, { plan: Plan; expiresAt: number }>();
const CACHE_TTL_MS = 5 * 60_000; // 5 minutes

async function resolveUserPlan(userId: string): Promise<Plan> {
  const cached = planCache.get(userId);
  if (cached && Date.now() < cached.expiresAt) {
    return cached.plan;
  }

  const [sub] = await db
    .select({ plan: subscriptions.plan })
    .from(subscriptions)
    .where(
      and(eq(subscriptions.userId, userId), eq(subscriptions.status, "active")),
    )
    .limit(1);

  const plan: Plan = sub?.plan ?? "free";

  planCache.set(userId, {
    plan,
    expiresAt: Date.now() + CACHE_TTL_MS,
  });

  return plan;
}

/**
 * Middleware that restricts access to routes based on the user's subscription plan.
 * Must be used after authMiddleware (requires c.get("auth")).
 */
export function planGuard(...allowedPlans: Plan[]) {
  return createMiddleware(async (c, next) => {
    const auth = c.get("auth");
    const plan = await resolveUserPlan(auth.profileId);

    if (!allowedPlans.includes(plan)) {
      throw new HTTPException(403, {
        message: `This feature requires one of: ${allowedPlans.join(", ")}. Current plan: ${plan}. Please upgrade.`,
      });
    }

    await next();
  });
}

/** Clear the plan cache (useful in tests). */
export function clearPlanCache(): void {
  planCache.clear();
}
