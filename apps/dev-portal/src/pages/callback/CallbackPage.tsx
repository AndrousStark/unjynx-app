import React, { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Spin, Alert, Typography } from "antd";
import { userManager } from "@/providers/auth-provider";
import { COLORS } from "@/utils/constants";

/**
 * OIDC callback page for the dev portal.
 *
 * Processes the authorization code from Logto via oidc-client-ts
 * and redirects to the system health dashboard.
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
        await userManager.signinCallback();
        navigate("/system-health", { replace: true });
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
          background: COLORS.midnight,
          padding: 24,
        }}
      >
        <Alert
          type="error"
          message="Authentication Failed"
          description={error}
          showIcon
          action={
            <a href="/login" style={{ color: COLORS.violet }}>
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
        background: COLORS.midnight,
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
