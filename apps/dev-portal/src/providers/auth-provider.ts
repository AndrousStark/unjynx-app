// ============================================================
// UNJYNX Dev Portal - Auth Provider (Logto OIDC)
// ============================================================

import type { AuthProvider } from "@refinedev/core";
import { UserManager, WebStorageStateStore } from "oidc-client-ts";
import { LOGTO_CONFIG } from "@/utils/constants";

const userManager = new UserManager({
  authority: LOGTO_CONFIG.authority,
  client_id: LOGTO_CONFIG.clientId,
  redirect_uri: LOGTO_CONFIG.redirectUri,
  post_logout_redirect_uri: LOGTO_CONFIG.postLogoutRedirectUri,
  scope: LOGTO_CONFIG.scopes.join(" "),
  response_type: "code",
  userStore: new WebStorageStateStore({ store: window.localStorage }),
  // Request JWT (not opaque) by specifying the API resource
  extraQueryParams: { resource: LOGTO_CONFIG.resource },
  // Must also send resource during token exchange, otherwise Logto returns opaque token
  extraTokenParams: { resource: LOGTO_CONFIG.resource },
});

const ALLOWED_ROLES = ["owner", "admin"] as const;

const hasDevAccess = (roles: ReadonlyArray<string>): boolean =>
  roles.some((r) => (ALLOWED_ROLES as ReadonlyArray<string>).includes(r));

export const authProvider: AuthProvider = {
  login: async () => {
    try {
      await userManager.signinRedirect();
      return { success: true };
    } catch (error) {
      return {
        success: false,
        error: {
          name: "LoginError",
          message: String(error),
        },
      };
    }
  },

  logout: async () => {
    try {
      await userManager.signoutRedirect();
      return { success: true };
    } catch {
      // Even if logout fails, clear local state
      await userManager.removeUser();
      return { success: true, redirectTo: "/" };
    }
  },

  check: async () => {
    try {
      const user = await userManager.getUser();
      if (user && !user.expired) {
        const roles = (user.profile?.roles as string[]) ?? [];
        if (hasDevAccess(roles)) {
          return { authenticated: true };
        }
        return {
          authenticated: false,
          error: {
            name: "Forbidden",
            message: "Insufficient permissions. Dev admin or super admin role required.",
          },
          logout: true,
        };
      }
      return { authenticated: false, redirectTo: "/login" };
    } catch {
      return { authenticated: false, redirectTo: "/login" };
    }
  },

  getPermissions: async () => {
    const user = await userManager.getUser();
    return (user?.profile?.roles as string[]) ?? [];
  },

  getIdentity: async () => {
    const user = await userManager.getUser();
    if (!user) return null;
    return {
      id: user.profile.sub,
      name: user.profile.name ?? user.profile.email ?? "Developer",
      avatar: user.profile.picture ?? undefined,
      email: user.profile.email,
      roles: (user.profile.roles as string[]) ?? [],
    };
  },

  onError: async (error) => {
    const status = (error as { statusCode?: number })?.statusCode;
    if (status === 401 || status === 403) {
      return { logout: true, redirectTo: "/login" };
    }
    return { error };
  },
};

export { userManager };
