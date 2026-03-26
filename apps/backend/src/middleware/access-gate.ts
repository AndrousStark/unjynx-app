// ── Three-Layer Access Gate ──────────────────────────────────────────
//
// Production-grade entitlement system combining:
//   Layer 1: Plan entitlements (does this plan include feature X?)
//   Layer 2: Role permissions (does this user's role allow action Y?)
//   Layer 3: Feature flags (is feature X currently enabled/rolled out?)
//
// Access = Plan.includes(feature) AND Role.permits(action) AND Flag.isEnabled(feature)
//
// All checks are server-side enforced. Client-side checks are for UX only.
// Results are cached per-user for 5 minutes to minimize DB hits.

import { createMiddleware } from "hono/factory";
import { eq, and } from "drizzle-orm";
import { db } from "../db/index.js";
import { profiles, featureFlags, subscriptions } from "../db/schema/index.js";
import { env } from "../env.js";

// ── Feature Catalog ─────────────────────────────────────────────────
// Single source of truth for what each plan includes.
// Add new features here — never scatter plan checks across codebase.

type PlanTier = "free" | "pro" | "team" | "enterprise";
type RoleName = "owner" | "admin" | "member" | "viewer" | "guest";

interface FeatureDefinition {
  /** Human-readable name */
  readonly name: string;
  /** Which plans include this feature */
  readonly plans: readonly PlanTier[];
  /** Minimum role required (null = any authenticated user) */
  readonly minRole: RoleName | null;
  /** Feature flag key to check (null = always on if plan allows) */
  readonly flagKey: string | null;
  /** Hard limit per plan (null = unlimited) */
  readonly limits?: Readonly<Partial<Record<PlanTier, number>>>;
}

// Role hierarchy: owner > admin > member > viewer > guest
const ROLE_HIERARCHY: Record<RoleName, number> = {
  owner: 100,
  admin: 80,
  member: 60,
  viewer: 40,
  guest: 20,
};

export const FEATURES: Record<string, FeatureDefinition> = {
  // ── Core (all plans) ────────────────────────────────────────
  "tasks.create": {
    name: "Create tasks",
    plans: ["free", "pro", "team", "enterprise"],
    minRole: "member",
    flagKey: null,
    limits: { free: 25, pro: Infinity, team: Infinity, enterprise: Infinity },
  },
  "projects.create": {
    name: "Create projects",
    plans: ["free", "pro", "team", "enterprise"],
    minRole: "member",
    flagKey: null,
    limits: { free: 3, pro: Infinity, team: Infinity, enterprise: Infinity },
  },
  "tasks.read": {
    name: "View tasks",
    plans: ["free", "pro", "team", "enterprise"],
    minRole: "viewer",
    flagKey: null,
  },
  "pomodoro": {
    name: "Pomodoro timer",
    plans: ["free", "pro", "team", "enterprise"],
    minRole: "member",
    flagKey: null,
  },
  "content.daily": {
    name: "Daily content",
    plans: ["free", "pro", "team", "enterprise"],
    minRole: "viewer",
    flagKey: null,
  },
  "progress.view": {
    name: "Progress tracking",
    plans: ["free", "pro", "team", "enterprise"],
    minRole: "viewer",
    flagKey: null,
  },

  // ── Pro+ features ───────────────────────────────────────────
  "channels.telegram": {
    name: "Telegram notifications",
    plans: ["pro", "team", "enterprise"],
    minRole: "member",
    flagKey: "telegram_reminders",
  },
  "channels.whatsapp": {
    name: "WhatsApp notifications",
    plans: ["pro", "team", "enterprise"],
    minRole: "member",
    flagKey: "whatsapp_reminders",
  },
  "channels.sms": {
    name: "SMS notifications",
    plans: ["pro", "team", "enterprise"],
    minRole: "member",
    flagKey: null,
  },
  "channels.email": {
    name: "Email notifications",
    plans: ["pro", "team", "enterprise"],
    minRole: "member",
    flagKey: null,
  },
  "channels.instagram": {
    name: "Instagram notifications",
    plans: ["pro", "team", "enterprise"],
    minRole: "member",
    flagKey: null,
  },
  "channels.slack": {
    name: "Slack notifications",
    plans: ["pro", "team", "enterprise"],
    minRole: "member",
    flagKey: null,
  },
  "channels.discord": {
    name: "Discord notifications",
    plans: ["pro", "team", "enterprise"],
    minRole: "member",
    flagKey: null,
  },
  "ghost_mode": {
    name: "Ghost Mode (focus)",
    plans: ["pro", "team", "enterprise"],
    minRole: "member",
    flagKey: "ghost_mode_v2",
  },
  "time_blocking": {
    name: "Time blocking",
    plans: ["pro", "team", "enterprise"],
    minRole: "member",
    flagKey: null,
  },
  "ai.chat": {
    name: "AI chat",
    plans: ["pro", "team", "enterprise"],
    minRole: "member",
    flagKey: "ai_chat",
    limits: { pro: 100, team: 200, enterprise: 1000 },
  },
  "ai.schedule": {
    name: "AI scheduling",
    plans: ["pro", "team", "enterprise"],
    minRole: "member",
    flagKey: "ai_chat",
  },
  "ai.insights": {
    name: "AI insights",
    plans: ["pro", "team", "enterprise"],
    minRole: "member",
    flagKey: "ai_chat",
  },
  "recurring.advanced": {
    name: "Advanced recurring rules",
    plans: ["pro", "team", "enterprise"],
    minRole: "member",
    flagKey: null,
  },
  "import_export": {
    name: "Import & Export",
    plans: ["pro", "team", "enterprise"],
    minRole: "member",
    flagKey: null,
  },

  // ── Team+ features ──────────────────────────────────────────
  "teams.create": {
    name: "Create teams",
    plans: ["team", "enterprise"],
    minRole: "member",
    flagKey: null,
  },
  "teams.manage": {
    name: "Manage team members",
    plans: ["team", "enterprise"],
    minRole: "admin",
    flagKey: null,
  },
  "teams.reports": {
    name: "Team reports",
    plans: ["team", "enterprise"],
    minRole: "member",
    flagKey: null,
  },
  "api.access": {
    name: "API access",
    plans: ["team", "enterprise"],
    minRole: "admin",
    flagKey: null,
  },

  // ── Enterprise features ─────────────────────────────────────
  "sso.saml": {
    name: "SSO / SAML",
    plans: ["enterprise"],
    minRole: "owner",
    flagKey: null,
  },
  "audit_log.access": {
    name: "Audit log access",
    plans: ["enterprise"],
    minRole: "admin",
    flagKey: null,
  },
  "custom_branding": {
    name: "Custom branding",
    plans: ["enterprise"],
    minRole: "owner",
    flagKey: null,
  },
} as const;

// ── Caches ──────────────────────────────────────────────────────────

interface CachedPlan {
  readonly plan: PlanTier;
  readonly expiresAt: number;
}

interface CachedFlag {
  readonly status: string;
  readonly percentage: number | null;
  readonly userList: string | null;
  readonly expiresAt: number;
}

const planCache = new Map<string, CachedPlan>();
const flagCache = new Map<string, CachedFlag>();
const PLAN_CACHE_TTL = 5 * 60_000; // 5 minutes
const FLAG_CACHE_TTL = 2 * 60_000; // 2 minutes

// ── Resolution Functions ────────────────────────────────────────────

async function resolveUserPlan(userId: string): Promise<PlanTier> {
  // Alpha mode: everyone is enterprise
  if (process.env.ALPHA_MODE === "true") return "enterprise";

  const cached = planCache.get(userId);
  if (cached && Date.now() < cached.expiresAt) return cached.plan;

  try {
    // Check subscription table using parameterized query (Drizzle ORM)
    const [row] = await db
      .select({ plan: subscriptions.plan })
      .from(subscriptions)
      .where(and(eq(subscriptions.userId, userId), eq(subscriptions.status, "active")))
      .limit(1);

    const plan = (row?.plan as PlanTier) ?? "free";
    planCache.set(userId, { plan, expiresAt: Date.now() + PLAN_CACHE_TTL });
    return plan;
  } catch {
    return "free";
  }
}

async function resolveFeatureFlag(
  flagKey: string,
  userId: string,
): Promise<boolean> {
  const cached = flagCache.get(flagKey);
  let flag: CachedFlag;

  if (cached && Date.now() < cached.expiresAt) {
    flag = cached;
  } else {
    try {
      const [row] = await db
        .select()
        .from(featureFlags)
        .where(eq(featureFlags.key, flagKey))
        .limit(1);

      if (!row) {
        // Flag doesn't exist = feature is ON (no gate)
        flagCache.set(flagKey, {
          status: "enabled",
          percentage: null,
          userList: null,
          expiresAt: Date.now() + FLAG_CACHE_TTL,
        });
        return true;
      }

      flag = {
        status: row.status,
        percentage: row.percentage,
        userList: row.userList,
        expiresAt: Date.now() + FLAG_CACHE_TTL,
      };
      flagCache.set(flagKey, flag);
    } catch {
      return true; // Fail open — don't block on flag DB errors
    }
  }

  switch (flag.status) {
    case "enabled":
      return true;
    case "disabled":
      return false;
    case "percentage": {
      // Deterministic hash: same user always gets same result
      const hash = simpleHash(`${flagKey}:${userId}`);
      return hash % 100 < (flag.percentage ?? 0);
    }
    case "user_list": {
      if (!flag.userList) return false;
      try {
        const list = JSON.parse(flag.userList) as string[];
        return list.includes(userId);
      } catch {
        return false;
      }
    }
    default:
      return true;
  }
}

function simpleHash(str: string): number {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = (hash * 31 + str.charCodeAt(i)) | 0;
  }
  return Math.abs(hash);
}

function hasMinRole(userRole: RoleName, requiredRole: RoleName): boolean {
  return (ROLE_HIERARCHY[userRole] ?? 0) >= (ROLE_HIERARCHY[requiredRole] ?? 0);
}

// ── Public API ──────────────────────────────────────────────────────

export interface AccessCheckResult {
  readonly allowed: boolean;
  readonly reason?: string;
  readonly requiredPlan?: PlanTier;
  readonly upgradeUrl?: string;
  readonly limit?: number;
}

/**
 * Check if a user has access to a feature.
 *
 * Performs all 3 layers:
 *   1. Plan entitlement check
 *   2. Role permission check
 *   3. Feature flag check
 *
 * Returns detailed result for client-side upgrade prompts.
 */
export async function checkAccess(
  userId: string,
  userRole: RoleName,
  featureKey: string,
): Promise<AccessCheckResult> {
  const feature = FEATURES[featureKey];
  if (!feature) {
    return { allowed: false, reason: "Unknown feature" };
  }

  // Layer 1: Plan check
  const plan = await resolveUserPlan(userId);
  if (!feature.plans.includes(plan)) {
    const requiredPlan = feature.plans[0] as PlanTier;
    return {
      allowed: false,
      reason: `${feature.name} requires ${requiredPlan} plan or higher`,
      requiredPlan,
      upgradeUrl: "/billing/upgrade",
    };
  }

  // Layer 2: Role check
  if (feature.minRole && !hasMinRole(userRole, feature.minRole)) {
    return {
      allowed: false,
      reason: `${feature.name} requires ${feature.minRole} role or higher`,
    };
  }

  // Layer 3: Feature flag check
  if (feature.flagKey) {
    const flagEnabled = await resolveFeatureFlag(feature.flagKey, userId);
    if (!flagEnabled) {
      return {
        allowed: false,
        reason: `${feature.name} is not yet available`,
      };
    }
  }

  // Get plan-specific limit
  const limit = feature.limits?.[plan] ?? undefined;

  return { allowed: true, limit: limit === Infinity ? undefined : limit };
}

/**
 * Middleware factory: gate a route behind a feature.
 *
 * Usage: app.post("/tasks", accessGate("tasks.create"), handler)
 *
 * On denial, returns 403 with upgrade info:
 * { success: false, error: "...", requiredPlan: "pro", upgradeUrl: "/billing/upgrade" }
 */
export function accessGate(featureKey: string) {
  return createMiddleware(async (c, next) => {
    const auth = c.get("auth");
    const userRole = (auth.adminRole ?? "member") as RoleName;

    const result = await checkAccess(auth.profileId, userRole, featureKey);

    if (!result.allowed) {
      return c.json(
        {
          success: false,
          data: null,
          error: result.reason,
          requiredPlan: result.requiredPlan,
          upgradeUrl: result.upgradeUrl,
        },
        403,
      );
    }

    // Attach limit to context for handlers to check
    if (result.limit !== undefined) {
      c.set("featureLimit" as never, result.limit as never);
    }

    await next();
  });
}

/**
 * Get all features with their access status for a user.
 *
 * Used by the client to show/hide/gray-out features.
 * GET /api/v1/auth/entitlements
 */
export async function getUserEntitlements(
  userId: string,
  userRole: RoleName,
): Promise<Record<string, AccessCheckResult>> {
  const results: Record<string, AccessCheckResult> = {};

  for (const [key, _] of Object.entries(FEATURES)) {
    results[key] = await checkAccess(userId, userRole, key);
  }

  return results;
}

// ── Cache Management ────────────────────────────────────────────────

export function clearPlanCache(): void {
  planCache.clear();
}

export function clearFlagCache(): void {
  flagCache.clear();
}

export function clearAllGateCaches(): void {
  planCache.clear();
  flagCache.clear();
}
