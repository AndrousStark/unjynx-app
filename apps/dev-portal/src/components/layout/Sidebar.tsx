// ============================================================
// UNJYNX Dev Portal - Sidebar Component
// ============================================================

import { Layout, Menu, Typography } from "antd";
import {
  DashboardOutlined,
  DatabaseOutlined,
  ApiOutlined,
  CloudServerOutlined,
  BellOutlined,
  RobotOutlined,
  MessageOutlined,
  NodeIndexOutlined,
} from "@ant-design/icons";
import { useNavigate, useLocation } from "react-router-dom";
import { COLORS } from "@/utils/constants";

const { Sider } = Layout;

const iconMap: Record<string, React.ReactNode> = {
  dashboard: <DashboardOutlined />,
  database: <DatabaseOutlined />,
  api: <ApiOutlined />,
  "cloud-server": <CloudServerOutlined />,
  bell: <BellOutlined />,
  robot: <RobotOutlined />,
  message: <MessageOutlined />,
  "node-index": <NodeIndexOutlined />,
};

const menuItems = [
  { key: "/system-health", label: "System Health", icon: "dashboard" },
  { key: "/database", label: "Database", icon: "database" },
  { key: "/api-management", label: "API Management", icon: "api" },
  { key: "/deployment", label: "Deployment", icon: "cloud-server" },
  { key: "/notifications", label: "Notifications", icon: "bell" },
  { key: "/ai-models", label: "AI Models", icon: "robot" },
  { key: "/channel-providers", label: "Channels", icon: "message" },
  { key: "/data-pipeline", label: "Data Pipeline", icon: "node-index" },
];

interface SidebarProps {
  readonly collapsed: boolean;
  readonly onCollapse: (collapsed: boolean) => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ collapsed, onCollapse }) => {
  const navigate = useNavigate();
  const location = useLocation();

  return (
    <Sider
      collapsible
      collapsed={collapsed}
      onCollapse={onCollapse}
      width={240}
      style={{
        background: "#0F0A1A",
        borderRight: "1px solid #2D2640",
        overflow: "auto",
        height: "100vh",
        position: "fixed",
        left: 0,
        top: 0,
        bottom: 0,
        zIndex: 100,
      }}
      data-testid="sidebar"
    >
      <div
        style={{
          height: 64,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          borderBottom: "1px solid #2D2640",
        }}
      >
        <Typography.Title
          level={4}
          style={{
            margin: 0,
            color: COLORS.gold,
            fontFamily: "'Inter', sans-serif",
            fontWeight: 700,
            letterSpacing: 2,
          }}
        >
          {collapsed ? "U" : "UNJYNX"}
        </Typography.Title>
        {!collapsed && (
          <Typography.Text
            style={{
              color: COLORS.violet,
              fontSize: 10,
              marginLeft: 8,
              textTransform: "uppercase",
              letterSpacing: 1,
            }}
          >
            DEV
          </Typography.Text>
        )}
      </div>

      <Menu
        mode="inline"
        selectedKeys={[location.pathname]}
        onClick={({ key }) => navigate(key)}
        style={{
          background: "transparent",
          borderRight: "none",
          marginTop: 8,
        }}
        items={menuItems.map((item) => ({
          key: item.key,
          icon: iconMap[item.icon],
          label: item.label,
        }))}
      />
    </Sider>
  );
};
