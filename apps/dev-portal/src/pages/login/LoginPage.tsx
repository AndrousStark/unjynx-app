import React from "react";
import { Card, Button, Typography, Space, Alert } from "antd";
import { CodeOutlined } from "@ant-design/icons";
import { useLogin } from "@refinedev/core";
import { COLORS } from "@/utils/constants";

const { Title, Text, Paragraph } = Typography;

export const LoginPage: React.FC = () => {
  const { mutate: login, isPending } = useLogin();
  const [error, setError] = React.useState<string | null>(null);

  const handleLogin = () => {
    setError(null);
    login(
      {},
      {
        onError: (err) => {
          setError(err?.message ?? "Login failed");
        },
      },
    );
  };

  return (
    <div
      style={{
        minHeight: "100vh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        background: `linear-gradient(135deg, ${COLORS.midnight} 0%, #1a1030 50%, ${COLORS.midnight} 100%)`,
        padding: 24,
      }}
    >
      <Card
        style={{
          width: 420,
          borderRadius: 12,
          background: "#1A1528",
          border: "1px solid #2D2640",
          boxShadow: `0 8px 32px ${COLORS.violet}33`,
        }}
        styles={{ body: { padding: 40 } }}
      >
        <div style={{ textAlign: "center", marginBottom: 32 }}>
          <img
            src="/logo-icon.png"
            alt="UNJYNX"
            style={{
              width: 64,
              height: 64,
              objectFit: "contain",
              marginBottom: 12,
              filter: "drop-shadow(0 4px 12px rgba(108, 92, 231, 0.3))",
            }}
          />
          <Title
            level={2}
            style={{
              color: COLORS.gold,
              marginBottom: 4,
              letterSpacing: 3,
            }}
          >
            UNJYNX
          </Title>
          <Text style={{ color: COLORS.textSecondary }}>Developer Portal</Text>
        </div>

        {error && (
          <Alert
            message={error}
            type="error"
            showIcon
            closable
            onClose={() => setError(null)}
            style={{ marginBottom: 24 }}
          />
        )}

        <Space direction="vertical" size="middle" style={{ width: "100%" }}>
          <Button
            type="primary"
            icon={<CodeOutlined />}
            onClick={handleLogin}
            loading={isPending}
            block
            size="large"
            style={{
              background: COLORS.violet,
              height: 48,
              fontWeight: 600,
              fontSize: 16,
            }}
          >
            Sign in with Logto
          </Button>

          <Paragraph
            style={{ textAlign: "center", marginTop: 16, fontSize: 12, marginBottom: 0, color: COLORS.textSecondary }}
          >
            Only users with dev_admin or super_admin roles can access
            this portal.
          </Paragraph>
        </Space>
      </Card>
    </div>
  );
};
