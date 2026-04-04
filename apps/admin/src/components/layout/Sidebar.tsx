import React from "react";
import { Layout, Menu } from "antd";
import {
  DashboardOutlined,
  UserOutlined,
  FileTextOutlined,
  BellOutlined,
  FlagOutlined,
  BarChartOutlined,
  CustomerServiceOutlined,
  DollarOutlined,
  SafetyOutlined,
} from "@ant-design/icons";
import { useNavigate, useLocation } from "react-router-dom";
import { useCan } from "@refinedev/core";
import { BRAND_COLORS } from "../../utils/constants";

const { Sider } = Layout;

interface SidebarProps {
  readonly collapsed: boolean;
  readonly onCollapse: (collapsed: boolean) => void;
}

interface MenuItem {
  readonly key: string;
  readonly icon: React.ReactNode;
  readonly label: string;
  readonly resource: string;
}

const ALL_MENU_ITEMS: readonly MenuItem[] = [
  { key: "/", icon: <DashboardOutlined />, label: "Dashboard", resource: "dashboard" },
  { key: "/users", icon: <UserOutlined />, label: "Users", resource: "users" },
  { key: "/content", icon: <FileTextOutlined />, label: "Content", resource: "content" },
  { key: "/notifications", icon: <BellOutlined />, label: "Notifications", resource: "notifications" },
  { key: "/feature-flags", icon: <FlagOutlined />, label: "Feature Flags", resource: "feature-flags" },
  { key: "/analytics", icon: <BarChartOutlined />, label: "Analytics", resource: "analytics" },
  { key: "/support", icon: <CustomerServiceOutlined />, label: "Support", resource: "support" },
  { key: "/billing", icon: <DollarOutlined />, label: "Billing", resource: "billing" },
  { key: "/compliance", icon: <SafetyOutlined />, label: "Compliance", resource: "compliance" },
] as const;

function SidebarMenuItem({ item }: { readonly item: MenuItem }) {
  const { data } = useCan({ resource: item.resource, action: "list" });
  if (data?.can === false) return null;
  return null; // We just use this for filtering
}

export const Sidebar: React.FC<SidebarProps> = ({ collapsed, onCollapse }) => {
  const navigate = useNavigate();
  const location = useLocation();

  const selectedKey = location.pathname === "/"
    ? "/"
    : `/${location.pathname.split("/")[1]}`;

  return (
    <Sider
      collapsible
      collapsed={collapsed}
      onCollapse={onCollapse}
      style={{
        background: BRAND_COLORS.midnight,
        borderRight: `1px solid ${BRAND_COLORS.violet}33`,
      }}
      width={240}
    >
      <div
        style={{
          height: 64,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          borderBottom: `1px solid ${BRAND_COLORS.violet}33`,
          padding: collapsed ? "0 8px" : "0 16px",
        }}
      >
        {collapsed ? (
          <img
            src="/logo-icon.png"
            alt="UNJYNX"
            style={{
              height: 32,
              width: 32,
              objectFit: "contain",
              filter: "drop-shadow(0 2px 6px rgba(108, 92, 231, 0.4))",
            }}
          />
        ) : (
          <img
            src="/logo-dark.png"
            alt="UNJYNX"
            style={{
              height: 36,
              width: "auto",
              objectFit: "contain",
              filter: "drop-shadow(0 2px 8px rgba(108, 92, 231, 0.3))",
            }}
          />
        )}
      </div>

      <Menu
        mode="inline"
        selectedKeys={[selectedKey]}
        onClick={({ key }) => navigate(key)}
        style={{
          background: "transparent",
          borderRight: "none",
          marginTop: 8,
        }}
        theme="dark"
        items={ALL_MENU_ITEMS.map((item) => ({
          key: item.key,
          icon: item.icon,
          label: item.label,
        }))}
      />
    </Sider>
  );
};
