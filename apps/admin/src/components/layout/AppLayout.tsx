import React, { useState } from "react";
import { Layout } from "antd";
import { Outlet } from "react-router-dom";
import { Sidebar } from "./Sidebar";
import { Header } from "./Header";

const { Content } = Layout;

interface AppLayoutProps {
  readonly isDarkMode: boolean;
  readonly onToggleDarkMode: () => void;
}

export const AppLayout: React.FC<AppLayoutProps> = ({
  isDarkMode,
  onToggleDarkMode,
}) => {
  const [collapsed, setCollapsed] = useState(false);

  return (
    <Layout style={{ minHeight: "100vh" }}>
      <Sidebar collapsed={collapsed} onCollapse={setCollapsed} />
      <Layout>
        <Header isDarkMode={isDarkMode} onToggleDarkMode={onToggleDarkMode} />
        <Content
          style={{
            margin: 24,
            padding: 24,
            minHeight: 280,
          }}
        >
          <Outlet />
        </Content>
      </Layout>
    </Layout>
  );
};
