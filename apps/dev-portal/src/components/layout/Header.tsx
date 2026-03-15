// ============================================================
// UNJYNX Dev Portal - Header Component
// ============================================================

import { Layout, Typography, Avatar, Dropdown, Space, Badge, Button } from "antd";
import {
  UserOutlined,
  LogoutOutlined,
  BellOutlined,
  SettingOutlined,
  ReloadOutlined,
} from "@ant-design/icons";
import { useGetIdentity, useLogout } from "@refinedev/core";
import { COLORS } from "@/utils/constants";

const { Header: AntHeader } = Layout;

interface UserIdentity {
  readonly id: string;
  readonly name: string;
  readonly email?: string;
  readonly avatar?: string;
  readonly roles?: ReadonlyArray<string>;
}

interface HeaderProps {
  readonly collapsed: boolean;
}

export const Header: React.FC<HeaderProps> = ({ collapsed }) => {
  const { data: user } = useGetIdentity<UserIdentity>();
  const { mutate: logout } = useLogout();

  const dropdownItems = {
    items: [
      {
        key: "user-info",
        label: (
          <div style={{ padding: "4px 0" }}>
            <Typography.Text strong>{user?.name ?? "Developer"}</Typography.Text>
            <br />
            <Typography.Text type="secondary" style={{ fontSize: 12 }}>
              {user?.email ?? "dev@unjynx.com"}
            </Typography.Text>
          </div>
        ),
        disabled: true,
      },
      { type: "divider" as const },
      {
        key: "settings",
        icon: <SettingOutlined />,
        label: "Settings",
      },
      {
        key: "logout",
        icon: <LogoutOutlined />,
        label: "Sign Out",
        danger: true,
        onClick: () => logout(),
      },
    ],
  };

  return (
    <AntHeader
      style={{
        background: "#0F0A1A",
        borderBottom: "1px solid #2D2640",
        padding: "0 24px",
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        position: "fixed",
        top: 0,
        right: 0,
        left: collapsed ? 80 : 240,
        zIndex: 99,
        transition: "left 0.2s",
        height: 64,
      }}
      data-testid="header"
    >
      <Typography.Text style={{ color: "#9CA3AF", fontSize: 13 }}>
        Developer Portal
      </Typography.Text>

      <Space size={16}>
        <Button
          type="text"
          icon={<ReloadOutlined />}
          style={{ color: "#9CA3AF" }}
          onClick={() => window.location.reload()}
          title="Refresh"
        />

        <Badge count={0} size="small">
          <Button
            type="text"
            icon={<BellOutlined />}
            style={{ color: "#9CA3AF" }}
          />
        </Badge>

        <Dropdown menu={dropdownItems} placement="bottomRight" trigger={["click"]}>
          <Space style={{ cursor: "pointer" }}>
            <Avatar
              size={32}
              src={user?.avatar}
              icon={!user?.avatar ? <UserOutlined /> : undefined}
              style={{ background: COLORS.violet }}
            />
            <Typography.Text style={{ color: COLORS.white, fontSize: 13 }}>
              {user?.name ?? "Developer"}
            </Typography.Text>
          </Space>
        </Dropdown>
      </Space>
    </AntHeader>
  );
};
