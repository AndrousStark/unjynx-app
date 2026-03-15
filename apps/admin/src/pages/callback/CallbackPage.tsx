import React, { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Spin, Alert, Typography } from "antd";
import { userManager } from "../../providers/auth-provider";
import { API_BASE_URL, BRAND_COLORS } from "../../utils/constants";

const ADMIN_ROLE_KEY = "unjynx_admin_role";

/**
 * Map backend admin_role enum to frontend AdminRole type.
 */
function mapAdminRole(dbRole: string | null | undefined): string {
  if (dbRole === "super_admin" || dbRole === "dev_admin") return "SUPER_ADMIN";
  return "VIEWER";
}

/**
 * OIDC callback page.
 *
 * Processes the authorization code from Logto, exchanges it for tokens
 * via oidc-client-ts, fetches the admin role from the backend, and
 * redirects to the dashboard.
 */
export const CallbackPage: React.FC = () => {
  const navigate = useNavigate();
  const [error, setError] = useState<string | null>(null);
  const processed = useRef(false);

  useEffect(() => {
    if (processed.current) return;
    processed.current = true;

    (async () => {
      try {
        // Exchange auth code for tokens
        const user = await userManager.signinCallback();

        if (!user?.access_token) {
          setError("Authentication failed — no access token received.");
          return;
        }

        // Fetch admin role from backend
        try {
          const response = await fetch(`${API_BASE_URL}/api/v1/auth/me`, {
            headers: { Authorization: `Bearer ${user.access_token}` },
          });

          if (response.ok) {
            const json = await response.json();
            const role = mapAdminRole(json.data?.adminRole);
            localStorage.setItem(ADMIN_ROLE_KEY, role);

            if (role === "VIEWER") {
              setError(
                "Access denied. Your account does not have admin privileges. " +
                  "Contact your administrator to get an admin role.",
              );
              await userManager.removeUser();
              localStorage.removeItem(ADMIN_ROLE_KEY);
              return;
            }
          } else {
            // Backend may not be reachable or token is opaque (not JWT).
            // Store a fallback and let check() handle it.
            console.warn("Could not fetch admin role:", response.status);
          }
        } catch (err) {
          console.warn("Admin role fetch failed:", err);
        }

        navigate("/", { replace: true });
      } catch (err) {
        console.error("OIDC callback error:", err);
        setError(
          `Authentication failed: ${err instanceof Error ? err.message : String(err)}`,
        );
      }
    })();
  }, [navigate]);

  if (error) {
    return (
      <div
        style={{
          minHeight: "100vh",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: BRAND_COLORS.midnight,
          padding: 24,
        }}
      >
        <Alert
          type="error"
          message="Authentication Failed"
          description={error}
          showIcon
          action={
            <a href="/login" style={{ color: BRAND_COLORS.violet }}>
              Back to Login
            </a>
          }
          style={{ maxWidth: 500 }}
        />
      </div>
    );
  }

  return (
    <div
      style={{
        minHeight: "100vh",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        background: BRAND_COLORS.midnight,
        gap: 16,
      }}
    >
      <Spin size="large" />
      <Typography.Text style={{ color: "#9CA3AF" }}>
        Completing sign-in...
      </Typography.Text>
    </div>
  );
};
