// ============================================================
// UNJYNX Dev Portal - App Root
// ============================================================

import { Refine, Authenticated } from "@refinedev/core";
import { RefineThemes, useNotificationProvider } from "@refinedev/antd";
import routerProvider from "@refinedev/react-router";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { ConfigProvider, theme, App as AntApp } from "antd";
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

import { authProvider } from "@/providers/auth-provider";
import { dataProvider } from "@/providers/data-provider";
import { DevLayout } from "@/components/layout/DevLayout";

import { SystemHealthPage } from "@/pages/system-health/SystemHealthPage";
import { DatabasePage } from "@/pages/database/DatabasePage";
import { ApiManagementPage } from "@/pages/api-management/ApiManagementPage";
import { DeploymentPage } from "@/pages/deployment/DeploymentPage";
import { NotificationInfraPage } from "@/pages/notifications/NotificationInfraPage";
import { AiModelPage } from "@/pages/ai-models/AiModelPage";
import { ChannelProvidersPage } from "@/pages/channel-providers/ChannelProvidersPage";
import { DataPipelinePage } from "@/pages/data-pipeline/DataPipelinePage";
import { LoginPage } from "@/pages/login/LoginPage";
import { CallbackPage } from "@/pages/callback/CallbackPage";

import { THEME_TOKEN } from "@/utils/constants";

import "@refinedev/antd/dist/reset.css";

const customTheme = {
  ...RefineThemes.Purple,
  algorithm: theme.darkAlgorithm,
  token: {
    ...THEME_TOKEN,
  },
  components: {
    Layout: {
      siderBg: "#0F0A1A",
      headerBg: "#0F0A1A",
      bodyBg: "#0F0A1A",
      triggerBg: "#1A1528",
    },
    Menu: {
      darkItemBg: "transparent",
      darkItemSelectedBg: "#2D2640",
      darkItemColor: "#9CA3AF",
      darkItemSelectedColor: "#FFD700",
      darkItemHoverColor: "#E5E7EB",
      darkItemHoverBg: "#1A1528",
    },
    Card: {
      colorBgContainer: "#1A1528",
      colorBorderSecondary: "#2D2640",
    },
    Table: {
      colorBgContainer: "#1A1528",
      headerBg: "#0F0A1A",
      rowHoverBg: "#2D2640",
      borderColor: "#2D2640",
      headerColor: "#9CA3AF",
    },
    Tabs: {
      inkBarColor: "#6C5CE7",
      itemSelectedColor: "#FFD700",
      itemColor: "#9CA3AF",
      itemHoverColor: "#E5E7EB",
    },
    Input: {
      colorBgContainer: "#0F0A1A",
      colorBorder: "#2D2640",
    },
    Select: {
      colorBgContainer: "#0F0A1A",
      colorBorder: "#2D2640",
    },
    Modal: {
      contentBg: "#1A1528",
      headerBg: "#1A1528",
    },
    Timeline: {
      dotBg: "transparent",
    },
    Statistic: {
      contentFontSize: 20,
    },
  },
};

const resources = [
  {
    name: "system-health",
    list: "/system-health",
    meta: { label: "System Health", icon: <DashboardOutlined /> },
  },
  {
    name: "database",
    list: "/database",
    meta: { label: "Database", icon: <DatabaseOutlined /> },
  },
  {
    name: "api-management",
    list: "/api-management",
    meta: { label: "API Management", icon: <ApiOutlined /> },
  },
  {
    name: "deployment",
    list: "/deployment",
    meta: { label: "Deployment", icon: <CloudServerOutlined /> },
  },
  {
    name: "notifications",
    list: "/notifications",
    meta: { label: "Notifications", icon: <BellOutlined /> },
  },
  {
    name: "ai-models",
    list: "/ai-models",
    meta: { label: "AI Models", icon: <RobotOutlined /> },
  },
  {
    name: "channel-providers",
    list: "/channel-providers",
    meta: { label: "Channel Providers", icon: <MessageOutlined /> },
  },
  {
    name: "data-pipeline",
    list: "/data-pipeline",
    meta: { label: "Data Pipeline", icon: <NodeIndexOutlined /> },
  },
];

const basePath = import.meta.env.BASE_URL?.replace(/\/$/, "") || "";

export const App: React.FC = () => (
  <BrowserRouter basename={basePath}>
    <ConfigProvider theme={customTheme}>
      <AntApp>
        <Refine
          routerProvider={routerProvider}
          dataProvider={dataProvider}
          authProvider={authProvider}
          notificationProvider={useNotificationProvider}
          resources={resources}
          options={{
            syncWithLocation: true,
            warnWhenUnsavedChanges: true,
          }}
        >
          <Routes>
            {/* Public routes */}
            <Route path="/login" element={<LoginPage />} />
            <Route path="/callback" element={<CallbackPage />} />

            {/* Protected routes */}
            <Route
              element={
                <Authenticated
                  key="auth"
                  fallback={<Navigate to="/login" />}
                >
                  <DevLayout />
                </Authenticated>
              }
            >
              <Route path="/system-health" element={<SystemHealthPage />} />
              <Route path="/database" element={<DatabasePage />} />
              <Route path="/api-management" element={<ApiManagementPage />} />
              <Route path="/deployment" element={<DeploymentPage />} />
              <Route path="/notifications" element={<NotificationInfraPage />} />
              <Route path="/ai-models" element={<AiModelPage />} />
              <Route path="/channel-providers" element={<ChannelProvidersPage />} />
              <Route path="/data-pipeline" element={<DataPipelinePage />} />
              <Route path="/" element={<Navigate to="/system-health" replace />} />
            </Route>

            <Route path="*" element={<Navigate to="/system-health" replace />} />
          </Routes>
        </Refine>
      </AntApp>
    </ConfigProvider>
  </BrowserRouter>
);
