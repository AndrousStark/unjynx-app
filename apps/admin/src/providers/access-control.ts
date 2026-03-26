import type { AccessControlProvider } from "@refinedev/core";

type AppRole = "owner" | "admin" | "member" | "viewer" | "guest";

const ADMIN_ROLE_KEY = "unjynx_admin_role";

/**
 * Role-based access control matrix.
 *
 * 5 roles: owner > admin > member > viewer > guest
 * - owner: full control (billing, roles, everything)
 * - admin: user management, content, flags, analytics (no billing)
 * - member: standard user (no admin portal access in practice)
 * - viewer: read-only
 * - guest: no admin access
 */
const PERMISSION_MATRIX: Record<string, readonly AppRole[]> = {
  // Dashboard
  "dashboard:list": ["owner", "admin", "viewer"],

  // Users
  "users:list": ["owner", "admin"],
  "users:show": ["owner", "admin"],
  "users:create": ["owner", "admin"],
  "users:edit": ["owner", "admin"],
  "users:delete": ["owner"],

  // Content
  "content:list": ["owner", "admin"],
  "content:show": ["owner", "admin"],
  "content:create": ["owner", "admin"],
  "content:edit": ["owner", "admin"],
  "content:delete": ["owner", "admin"],

  // Notifications
  "notifications:list": ["owner", "admin"],
  "notifications:show": ["owner", "admin"],
  "notifications:edit": ["owner"],

  // Feature Flags
  "feature-flags:list": ["owner", "admin"],
  "feature-flags:show": ["owner", "admin"],
  "feature-flags:create": ["owner"],
  "feature-flags:edit": ["owner"],
  "feature-flags:delete": ["owner"],

  // Analytics
  "analytics:list": ["owner", "admin"],

  // Support
  "support:list": ["owner", "admin"],
  "support:show": ["owner", "admin"],
  "support:edit": ["owner", "admin"],

  // Billing
  "billing:list": ["owner"],
  "billing:show": ["owner"],
  "billing:create": ["owner"],
  "billing:edit": ["owner"],
  "billing:delete": ["owner"],

  // Compliance
  "compliance:list": ["owner", "admin"],
  "compliance:show": ["owner", "admin"],
};

export const accessControlProvider: AccessControlProvider = {
  can: async ({ resource, action }) => {
    const role = (localStorage.getItem(ADMIN_ROLE_KEY) ?? "member") as AppRole;

    // owner bypasses all checks
    if (role === "owner") {
      return { can: true };
    }

    const key = `${resource}:${action}`;
    const allowedRoles = PERMISSION_MATRIX[key];

    if (!allowedRoles) {
      return { can: false, reason: "Insufficient permissions" };
    }

    const allowed = allowedRoles.includes(role);

    return {
      can: allowed,
      reason: allowed ? undefined : "Insufficient permissions",
    };
  },
};
