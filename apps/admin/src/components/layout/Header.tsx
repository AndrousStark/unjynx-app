import React from "react";
import { Layout, Avatar, Dropdown, Space, Typography, Switch, theme } from "antd";
import {
  UserOutlined,
  LogoutOutlined,
  BulbOutlined,
  BulbFilled,
} from "@ant-design/icons";
import { useGetIdentity, useLogout } from "@refinedev/core";
import { BRAND_COLORS } from "../../utils/constants";

const { Header: AntHeader } = Layout;
const { Text } = Typography;

interface HeaderProps {
  readonly isDarkMode: boolean;
  readonly onToggleDarkMode: () => void;
}

export const Header: React.FC<HeaderProps> = ({ isDarkMode, onToggleDarkMode }) => {
  const { data: identity } = useGetIdentity<{
    name: string;
    email: string;
    avatar?: string;
    role: string;
  }>();
  const { mutate: logout } = useLogout();
  const { token } = theme.useToken();

  const menuItems = [
    {
      key: "role",
      label: (
        <Text type="secondary" style={{ fontSize: 12 }}>
          Role: {identity?.role ?? "Unknown"}
        </Text>
      ),
      disabled: true,
    },
    { type: "divider" as const },
    {
      key: "logout",
      icon: <LogoutOutlined />,
      label: "Logout",
      danger: true,
      onClick: () => logout(),
    },
  ];

  return (
    <AntHeader
      style={{
        padding: "0 24px",
        background: token.colorBgContainer,
        borderBottom: `1px solid ${token.colorBorderSecondary}`,
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        height: 64,
      }}
    >
      <div>
        <Text strong style={{ fontSize: 16 }}>
          Admin Portal
        </Text>
      </div>

      <Space size="middle" align="center">
        <Switch
          checkedChildren={<BulbFilled />}
          unCheckedChildren={<BulbOutlined />}
          checked={isDarkMode}
          onChange={onToggleDarkMode}
        />

        <Dropdown menu={{ items: menuItems }} placement="bottomRight">
          <Space style={{ cursor: "pointer" }}>
            <Avatar
              size="small"
              src={identity?.avatar}
              icon={!identity?.avatar ? <UserOutlined /> : undefined}
              style={{
                backgroundColor: BRAND_COLORS.violet,
              }}
            />
            <Text>{identity?.name ?? "Admin"}</Text>
          </Space>
        </Dropdown>
      </Space>
    </AntHeader>
  );
};
