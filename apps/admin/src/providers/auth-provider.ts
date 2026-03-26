import type { AuthProvider } from "@refinedev/core";
import { UserManager, WebStorageStateStore } from "oidc-client-ts";
import { API_BASE_URL, LOGTO_CONFIG } from "../utils/constants";

const ADMIN_ROLE_KEY = "unjynx_admin_role";

export const userManager = new UserManager({
  authority: LOGTO_CONFIG.authority,
  client_id: LOGTO_CONFIG.clientId,
  client_secret: LOGTO_CONFIG.clientSecret,
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

/**
 * Map backend admin_role enum to frontend role.
 * DB values: "owner" | "admin" | "member" | "viewer" | "guest"
 * The role is passed through as-is (1:1 mapping).
 * Only owner and admin have admin portal access.
 */
function mapAdminRole(dbRole: string | null | undefined): string {
  if (dbRole === "owner" || dbRole === "admin") return dbRole;
  return "member"; // no admin access
}

/**
 * Get access token synchronously from oidc-client-ts localStorage.
 * Used by the data provider for Authorization headers.
 */
export function getAccessToken(): string | null {
  const key = `oidc.user:${LOGTO_CONFIG.authority}:${LOGTO_CONFIG.clientId}`;
  const raw = localStorage.getItem(key);
  if (!raw) return null;
  try {
    const data = JSON.parse(raw);
    return (data?.access_token as string) ?? null;
  } catch {
    return null;
  }
}

/**
 * Fetch admin role from backend and cache in localStorage.
 * Returns the mapped frontend role.
 */
async function fetchAndCacheAdminRole(accessToken: string): Promise<string> {
  const response = await fetch(`${API_BASE_URL}/api/v1/auth/me`, {
    headers: { Authorization: `Bearer ${accessToken}` },
  });

  if (!response.ok) {
    throw new Error(`Failed to fetch profile: ${response.status}`);
  }

  const json = await response.json();
  const dbRole = json.data?.adminRole as string | null;
  const role = mapAdminRole(dbRole);
  localStorage.setItem(ADMIN_ROLE_KEY, role);
  return role;
}

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
    localStorage.removeItem(ADMIN_ROLE_KEY);
    try {
      await userManager.signoutRedirect();
      return { success: true };
    } catch {
      await userManager.removeUser();
      return { success: true, redirectTo: "/login" };
    }
  },

  check: async () => {
    try {
      const user = await userManager.getUser();
      if (!user || user.expired) {
        return { authenticated: false, redirectTo: "/login" };
      }

      // Ensure we have the admin role cached
      let role = localStorage.getItem(ADMIN_ROLE_KEY);
      if (!role) {
        try {
          role = await fetchAndCacheAdminRole(user.access_token);
        } catch {
          return { authenticated: false, redirectTo: "/login" };
        }
      }

      if (role === "member") {
        // "member" means the user has no admin role — deny access
        localStorage.removeItem(ADMIN_ROLE_KEY);
        await userManager.removeUser();
        return {
          authenticated: false,
          error: {
            name: "Forbidden",
            message:
              "Admin access required. Contact your administrator to get an admin role.",
          },
          logout: true,
        };
      }

      return { authenticated: true };
    } catch {
      return { authenticated: false, redirectTo: "/login" };
    }
  },

  getIdentity: async () => {
    const user = await userManager.getUser();
    if (!user) return null;

    const role = localStorage.getItem(ADMIN_ROLE_KEY) ?? "member";

    return {
      id: user.profile.sub,
      name: user.profile.name ?? user.profile.email ?? "Admin",
      email: user.profile.email,
      avatar: user.profile.picture ?? undefined,
      role,
    };
  },

  getPermissions: async () => {
    return localStorage.getItem(ADMIN_ROLE_KEY) ?? "member";
  },

  onError: async (error) => {
    const status =
      (error as { statusCode?: number })?.statusCode ??
      (error as { status?: number })?.status;
    if (status === 401) {
      localStorage.removeItem(ADMIN_ROLE_KEY);
      return { logout: true, redirectTo: "/login" };
    }
    return { error };
  },
};
