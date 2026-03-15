import React, { useState, useMemo } from "react";
import {
  Typography,
  Row,
  Col,
  Card,
  Segmented,
  Table,
  Spin,
} from "antd";
import {
  UserOutlined,
  RiseOutlined,
  DollarOutlined,
  TeamOutlined,
} from "@ant-design/icons";
import { useCustom } from "@refinedev/core";
import { StatCard } from "../../components/charts/StatCard";
import { TrendLine } from "../../components/charts/TrendLine";
import { StackedBar } from "../../components/charts/StackedBar";
import { DonutChart } from "../../components/charts/DonutChart";
import { formatNumber, formatCurrency, formatPercentage } from "../../utils/formatters";
import { API_BASE_URL, API_ADMIN_PREFIX } from "../../utils/constants";
import type { AnalyticsOverview } from "../../types";

const { Title } = Typography;

type AnalyticsTab = "growth" | "engagement" | "revenue" | "cohort";

interface TrendPoint {
  date: string;
  count: number;
}

interface TaskActivityPoint {
  date: string;
  created: number;
  completed: number;
}

interface RevenuePoint {
  date: string;
  amount: number;
  currency: string;
}

interface PlanDist {
  plan: string;
  count: number;
}

interface BillingStats {
  totalSubscribers: number;
  activeSubscribers: number;
  mrr: number;
  cancelledThisMonth: number;
}

export const AnalyticsPage: React.FC = () => {
  const [activeTab, setActiveTab] = useState<AnalyticsTab>("growth");

  const { data: overviewData, isLoading: overviewLoading } = useCustom<AnalyticsOverview>({
    url: `${API_BASE_URL}${API_ADMIN_PREFIX}/analytics/overview`,
    method: "get",
  });

  const { data: signupData } = useCustom<TrendPoint[]>({
    url: `${API_BASE_URL}${API_ADMIN_PREFIX}/analytics/signup-trend`,
    method: "get",
    config: { query: { days: 42 } },
  });

  const { data: dauData } = useCustom<TrendPoint[]>({
    url: `${API_BASE_URL}${API_ADMIN_PREFIX}/analytics/dau-trend`,
    method: "get",
    config: { query: { days: 30 } },
  });

  const { data: taskData } = useCustom<TaskActivityPoint[]>({
    url: `${API_BASE_URL}${API_ADMIN_PREFIX}/analytics/task-activity`,
    method: "get",
    config: { query: { days: 7 } },
  });

  const { data: revenueData } = useCustom<RevenuePoint[]>({
    url: `${API_BASE_URL}${API_ADMIN_PREFIX}/analytics/revenue-trend`,
    method: "get",
    config: { query: { days: 180 } },
  });

  const { data: planData } = useCustom<PlanDist[]>({
    url: `${API_BASE_URL}${API_ADMIN_PREFIX}/analytics/plan-distribution`,
    method: "get",
  });

  const { data: billingData } = useCustom<BillingStats>({
    url: `${API_BASE_URL}${API_ADMIN_PREFIX}/billing/stats`,
    method: "get",
  });

  const overview = overviewData?.data;
  const billing = billingData?.data as unknown as BillingStats | undefined;

  const signupChartData = useMemo(() => {
    const raw = (signupData?.data as unknown as TrendPoint[]) ?? [];
    return raw.map((p) => ({ date: p.date.slice(5), signups: p.count }));
  }, [signupData]);

  const dauChartData = useMemo(() => {
    const raw = (dauData?.data as unknown as TrendPoint[]) ?? [];
    return raw.map((p) => ({ date: p.date.slice(5), dau: p.count }));
  }, [dauData]);

  const taskChartData = useMemo(() => {
    const raw = (taskData?.data as unknown as TaskActivityPoint[]) ?? [];
    return raw.map((p) => ({ date: p.date.slice(5), created: p.created, completed: p.completed }));
  }, [taskData]);

  const revenueChartData = useMemo(() => {
    const raw = (revenueData?.data as unknown as RevenuePoint[]) ?? [];
    return raw.map((p) => ({ date: p.date.slice(5), revenue: p.amount / 100 }));
  }, [revenueData]);

  const planChartData = useMemo(() => {
    const raw = (planData?.data as unknown as PlanDist[]) ?? [];
    return raw.map((p) => ({ name: p.plan.charAt(0).toUpperCase() + p.plan.slice(1), value: p.count }));
  }, [planData]);

  const totalSignups = signupChartData.reduce((sum, p) => sum + p.signups, 0);

  if (overviewLoading) {
    return (
      <div style={{ textAlign: "center", padding: 80 }}>
        <Spin size="large" />
      </div>
    );
  }

  return (
    <div>
      <Title level={3} style={{ marginBottom: 24 }}>
        Analytics
      </Title>

      <Segmented
        value={activeTab}
        onChange={(val) => setActiveTab(val as AnalyticsTab)}
        options={[
          { label: "Growth", value: "growth", icon: <RiseOutlined /> },
          { label: "Engagement", value: "engagement", icon: <TeamOutlined /> },
          { label: "Revenue", value: "revenue", icon: <DollarOutlined /> },
          { label: "Cohort", value: "cohort", icon: <UserOutlined /> },
        ]}
        block
        style={{ marginBottom: 24 }}
      />

      {activeTab === "growth" && (
        <div>
          <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
            <Col xs={24} sm={8}>
              <StatCard
                title="Total Users"
                value={formatNumber(overview?.totalUsers ?? 0)}
                prefix={<UserOutlined />}
                trendLabel="registered"
              />
            </Col>
            <Col xs={24} sm={8}>
              <StatCard
                title="Signups (42d)"
                value={formatNumber(totalSignups)}
                prefix={<RiseOutlined />}
                trendLabel="last 6 weeks"
              />
            </Col>
            <Col xs={24} sm={8}>
              <StatCard
                title="Active Subscriptions"
                value={formatNumber(overview?.totalSubscriptions ?? 0)}
                trendLabel="paid users"
              />
            </Col>
          </Row>

          <Row gutter={[16, 16]}>
            <Col xs={24} lg={12}>
              <TrendLine
                title="Signup Trend (6 weeks)"
                data={signupChartData}
                dataKeys={[{ key: "signups", label: "Signups" }]}
              />
            </Col>
            <Col xs={24} lg={12}>
              <TrendLine
                title="DAU Trend (30d)"
                data={dauChartData}
                dataKeys={[{ key: "dau", label: "DAU" }]}
              />
            </Col>
          </Row>
        </div>
      )}

      {activeTab === "engagement" && (
        <div>
          <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
            <Col xs={24} sm={8}>
              <StatCard
                title="DAU"
                value={formatNumber(overview?.activeUsersToday ?? 0)}
                trendLabel="today"
              />
            </Col>
            <Col xs={24} sm={8}>
              <StatCard
                title="MAU"
                value={formatNumber(overview?.activeUsersMonth ?? 0)}
                trendLabel="this month"
              />
            </Col>
            <Col xs={24} sm={8}>
              <StatCard
                title="DAU/MAU Ratio"
                value={formatPercentage(
                  overview?.activeUsersMonth
                    ? (overview.activeUsersToday / overview.activeUsersMonth) * 100
                    : 0,
                )}
                trendLabel="stickiness"
              />
            </Col>
          </Row>

          <Row gutter={[16, 16]}>
            <Col xs={24} lg={12}>
              <StackedBar
                title="Tasks Created vs Completed (7d)"
                data={taskChartData}
                dataKeys={[
                  { key: "created", label: "Created" },
                  { key: "completed", label: "Completed" },
                ]}
                stacked={false}
              />
            </Col>
            <Col xs={24} lg={12}>
              <DonutChart
                title="Users by Plan"
                data={planChartData}
              />
            </Col>
          </Row>
        </div>
      )}

      {activeTab === "revenue" && (
        <div>
          <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
            <Col xs={24} sm={6}>
              <StatCard
                title="MRR"
                value={formatCurrency((billing?.mrr ?? 0) / 100)}
                prefix={<DollarOutlined />}
                trendLabel="this month"
              />
            </Col>
            <Col xs={24} sm={6}>
              <StatCard
                title="Total Subscribers"
                value={formatNumber(billing?.totalSubscribers ?? 0)}
                trendLabel="all time"
              />
            </Col>
            <Col xs={24} sm={6}>
              <StatCard
                title="Active"
                value={formatNumber(billing?.activeSubscribers ?? 0)}
                trendLabel="paying now"
              />
            </Col>
            <Col xs={24} sm={6}>
              <StatCard
                title="Churn This Month"
                value={formatNumber(billing?.cancelledThisMonth ?? 0)}
                trendLabel="cancelled"
              />
            </Col>
          </Row>

          <Row gutter={[16, 16]}>
            <Col xs={24} lg={14}>
              <TrendLine
                title="Revenue Trend (6 months)"
                data={revenueChartData}
                dataKeys={[{ key: "revenue", label: "Revenue ($)" }]}
              />
            </Col>
            <Col xs={24} lg={10}>
              <DonutChart
                title="Subscribers by Plan"
                data={planChartData}
              />
            </Col>
          </Row>
        </div>
      )}

      {activeTab === "cohort" && (
        <Card bordered={false}>
          <Title level={5} style={{ marginBottom: 16 }}>
            User Growth by Period
          </Title>
          <Table
            dataSource={signupChartData.map((p, i) => ({
              key: i,
              date: p.date,
              signups: p.signups,
              cumulative: signupChartData.slice(0, i + 1).reduce((s, x) => s + x.signups, 0),
            }))}
            columns={[
              { title: "Date", dataIndex: "date", key: "date" },
              { title: "Signups", dataIndex: "signups", key: "signups" },
              { title: "Cumulative", dataIndex: "cumulative", key: "cumulative" },
            ]}
            pagination={false}
            size="middle"
          />
        </Card>
      )}
    </div>
  );
};
