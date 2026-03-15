import React, { useState } from "react";
import { Refine, Authenticated } from "@refinedev/core";
import { useNotificationProvider } from "@refinedev/antd";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { ConfigProvider, theme, App as AntApp } from "antd";
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

import { authProvider } from "./providers/auth-provider";
import { dataProvider } from "./providers/data-provider";
import { accessControlProvider } from "./providers/access-control";

import { AppLayout } from "./components/layout/AppLayout";
import { LoginPage } from "./pages/login/LoginPage";
import { CallbackPage } from "./pages/callback/CallbackPage";
import { DashboardPage } from "./pages/dashboard/DashboardPage";
import { UserList } from "./pages/users/UserList";
import { ContentList } from "./pages/content/ContentList";
import { ContentCreate } from "./pages/content/ContentCreate";
import { ContentCalendar } from "./pages/content/ContentCalendar";
import { NotificationDashboard } from "./pages/notifications/NotificationDashboard";
import { FailedNotifications } from "./pages/notifications/FailedNotifications";
import { FlagList } from "./pages/flags/FlagList";
import { AnalyticsPage } from "./pages/analytics/AnalyticsPage";
import { SupportPage } from "./pages/support/SupportPage";
import { BillingPage } from "./pages/billing/BillingPage";
import { CompliancePage } from "./pages/compliance/CompliancePage";

import { BRAND_COLORS } from "./utils/constants";

import "@refinedev/antd/dist/reset.css";

const DARK_MODE_KEY = "unjynx_admin_dark_mode";

function getInitialDarkMode(): boolean {
  const stored = localStorage.getItem(DARK_MODE_KEY);
  if (stored !== null) return stored === "true";
  return window.matchMedia?.("(prefers-color-scheme: dark)").matches ?? true;
}

const darkTheme = {
  algorithm: theme.darkAlgorithm,
  token: {
    colorPrimary: BRAND_COLORS.violet,
    colorBgBase: BRAND_COLORS.midnight,
    colorLink: BRAND_COLORS.gold,
    fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, sans-serif",
    borderRadius: 8,
  },
};

const lightTheme = {
  algorithm: theme.defaultAlgorithm,
  token: {
    colorPrimary: BRAND_COLORS.violet,
    colorBgBase: BRAND_COLORS.lightBg,
    colorLink: BRAND_COLORS.violet,
    fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, sans-serif",
    borderRadius: 8,
  },
};

const App: React.FC = () => {
  const [isDarkMode, setIsDarkMode] = useState(getInitialDarkMode);

  const toggleDarkMode = () => {
    setIsDarkMode((prev) => {
      const next = !prev;
      localStorage.setItem(DARK_MODE_KEY, String(next));
      return next;
    });
  };

  const currentTheme = isDarkMode ? darkTheme : lightTheme;

  const basePath = import.meta.env.BASE_URL?.replace(/\/$/, "") || "";

  return (
    <BrowserRouter basename={basePath}>
      <ConfigProvider theme={currentTheme}>
        <AntApp>
          <Refine
            authProvider={authProvider}
            dataProvider={dataProvider}
            accessControlProvider={accessControlProvider}
            notificationProvider={useNotificationProvider}
            resources={[
              {
                name: "dashboard",
                list: "/",
                meta: { label: "Dashboard", icon: <DashboardOutlined /> },
              },
              {
                name: "users",
                list: "/users",
                show: "/users/:id",
                meta: { label: "Users", icon: <UserOutlined /> },
              },
              {
                name: "content",
                list: "/content",
                create: "/content/create",
                meta: { label: "Content", icon: <FileTextOutlined /> },
              },
              {
                name: "notifications",
                list: "/notifications",
                meta: { label: "Notifications", icon: <BellOutlined /> },
              },
              {
                name: "feature-flags",
                list: "/feature-flags",
                create: "/feature-flags/create",
                show: "/feature-flags/:id",
                meta: { label: "Feature Flags", icon: <FlagOutlined /> },
              },
              {
                name: "analytics",
                list: "/analytics",
                meta: { label: "Analytics", icon: <BarChartOutlined /> },
              },
              {
                name: "support",
                list: "/support",
                meta: { label: "Support", icon: <CustomerServiceOutlined /> },
              },
              {
                name: "billing",
                list: "/billing",
                meta: { label: "Billing", icon: <DollarOutlined /> },
              },
              {
                name: "compliance",
                list: "/compliance",
                meta: { label: "Compliance", icon: <SafetyOutlined /> },
              },
              {
                name: "audit-log",
                list: "/compliance",
                meta: { hide: true },
              },
            ]}
            options={{
              syncWithLocation: true,
              warnWhenUnsavedChanges: true,
            }}
          >
            <Routes>
              <Route path="/login" element={<LoginPage />} />
              <Route path="/callback" element={<CallbackPage />} />

              <Route
                element={
                  <Authenticated
                    key="auth"
                    fallback={<Navigate to="/login" />}
                  >
                    <AppLayout
                      isDarkMode={isDarkMode}
                      onToggleDarkMode={toggleDarkMode}
                    />
                  </Authenticated>
                }
              >
                <Route index element={<DashboardPage />} />
                <Route path="/users" element={<UserList />} />
                <Route path="/content" element={<ContentList />} />
                <Route path="/content/create" element={<ContentCreate />} />
                <Route path="/content/calendar" element={<ContentCalendar />} />
                <Route path="/notifications" element={<NotificationDashboard />} />
                <Route path="/notifications/failed" element={<FailedNotifications />} />
                <Route path="/feature-flags" element={<FlagList />} />
                <Route path="/analytics" element={<AnalyticsPage />} />
                <Route path="/support" element={<SupportPage />} />
                <Route path="/billing" element={<BillingPage />} />
                <Route path="/compliance" element={<CompliancePage />} />
              </Route>

              <Route path="*" element={<Navigate to="/" />} />
            </Routes>
          </Refine>
        </AntApp>
      </ConfigProvider>
    </BrowserRouter>
  );
};

export default App;
