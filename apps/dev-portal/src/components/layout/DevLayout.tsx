// ============================================================
// UNJYNX Dev Portal - Main Layout
// ============================================================

import { useState } from "react";
import { Layout } from "antd";
import { Outlet } from "react-router-dom";
import { Sidebar } from "./Sidebar";
import { Header } from "./Header";

const { Content } = Layout;

export const DevLayout: React.FC = () => {
  const [collapsed, setCollapsed] = useState(false);

  return (
    <Layout style={{ minHeight: "100vh", background: "#0F0A1A" }}>
      <Sidebar collapsed={collapsed} onCollapse={setCollapsed} />

      <Layout
        style={{
          marginLeft: collapsed ? 80 : 240,
          transition: "margin-left 0.2s",
          background: "#0F0A1A",
        }}
      >
        <Header collapsed={collapsed} />

        <Content
          style={{
            marginTop: 64,
            padding: 24,
            background: "#0F0A1A",
            minHeight: "calc(100vh - 64px)",
          }}
          data-testid="layout-content"
        >
          <Outlet />
        </Content>
      </Layout>
    </Layout>
  );
};
