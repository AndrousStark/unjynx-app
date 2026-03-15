import React, { useMemo } from "react";
import { Row, Col, Typography, Spin } from "antd";
import {
  UserOutlined,
  RiseOutlined,
  DollarOutlined,
  ThunderboltOutlined,
} from "@ant-design/icons";
import { useCustom } from "@refinedev/core";
import { StatCard } from "../../components/charts/StatCard";
import { TrendLine } from "../../components/charts/TrendLine";
import { DonutChart } from "../../components/charts/DonutChart";
import { StackedBar } from "../../components/charts/StackedBar";
import { QuickActions } from "../../components/common/QuickActions";
import { formatNumber, formatCurrency } from "../../utils/formatters";
import { API_BASE_URL, API_ADMIN_PREFIX } from "../../utils/constants";
import type { AnalyticsOverview } from "../../types";

const { Title } = Typography;

interface TrendPoint {
  date: string;
  count: number;
}

interface PlanDist {
  plan: string;
  count: number;
}

interface NotifStats {
  channel: string;
  total: number;
  sent: number;
  delivered: number;
  failed: number;
  pending: number;
}

interface BillingStats {
  totalSubscribers: number;
  activeSubscribers: number;
  mrr: number;
  cancelledThisMonth: number;
}

interface QueueStatus {
  pending: number;
  queued: number;
  sent: number;
  failed: number;
  total: number;
}

export const DashboardPage: React.FC = () => {
  const { data: overviewData, isLoading } = useCustom<AnalyticsOverview>({
    url: `${API_BASE_URL}${API_ADMIN_PREFIX}/analytics/overview`,
    method: "get",
  });

  const { data: dauData } = useCustom<TrendPoint[]>({
    url: `${API_BASE_URL}${API_ADMIN_PREFIX}/analytics/dau-trend`,
    method: "get",
    config: { query: { days: 7 } },
  });

  const { data: planData } = useCustom<PlanDist[]>({
    url: `${API_BASE_URL}${API_ADMIN_PREFIX}/analytics/plan-distribution`,
    method: "get",
  });

  const { data: notifData } = useCustom<NotifStats[]>({
    url: `${API_BASE_URL}${API_ADMIN_PREFIX}/analytics/notification-stats`,
    method: "get",
  });

  const { data: billingData } = useCustom<BillingStats>({
    url: `${API_BASE_URL}${API_ADMIN_PREFIX}/billing/stats`,
    method: "get",
  });

  const { data: queueData } = useCustom<QueueStatus>({
    url: `${API_BASE_URL}${API_ADMIN_PREFIX}/notifications/queue-status`,
    method: "get",
  });

  const overview = overviewData?.data;
  const billing = billingData?.data;
  const queue = queueData?.data;

  const dauChartData = useMemo(() => {
    const raw = (dauData?.data as unknown as TrendPoint[]) ?? [];
    return raw.map((p) => ({
      date: p.date.slice(5),
      dau: p.count,
    }));
  }, [dauData]);

  const planChartData = useMemo(() => {
    const raw = (planData?.data as unknown as PlanDist[]) ?? [];
    return raw.map((p) => ({
      name: p.plan.charAt(0).toUpperCase() + p.plan.slice(1),
      value: p.count,
    }));
  }, [planData]);

  const notifChartData = useMemo(() => {
    const raw = (notifData?.data as unknown as NotifStats[]) ?? [];
    return raw.map((s) => ({
      channel: s.channel,
      delivered: s.delivered,
      sent: s.sent,
      failed: s.failed,
      pending: s.pending,
    }));
  }, [notifData]);

  if (isLoading) {
    return (
      <div style={{ textAlign: "center", padding: 80 }}>
        <Spin size="large" />
      </div>
    );
  }

  return (
    <div>
      <Title level={3} style={{ marginBottom: 24 }}>
        Dashboard
      </Title>

      {/* Stat Cards */}
      <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
        <Col xs={24} sm={12} lg={6}>
          <StatCard
            title="Total Users"
            value={formatNumber(overview?.totalUsers ?? 0)}
            prefix={<UserOutlined />}
            trendLabel="registered"
          />
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <StatCard
            title="DAU"
            value={formatNumber(overview?.activeUsersToday ?? 0)}
            prefix={<RiseOutlined />}
            trendLabel="active today"
          />
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <StatCard
            title="MRR"
            value={formatCurrency((billing as unknown as BillingStats)?.mrr ?? 0)}
            prefix={<DollarOutlined />}
            trendLabel="this month"
          />
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <StatCard
            title="Queue Pending"
            value={formatNumber(
              ((queue as unknown as QueueStatus)?.pending ?? 0) +
                ((queue as unknown as QueueStatus)?.queued ?? 0),
            )}
            prefix={<ThunderboltOutlined />}
            trendLabel="in queue"
          />
        </Col>
      </Row>

      {/* Charts Row 1 */}
      <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
        <Col xs={24} lg={16}>
          <TrendLine
            title="Daily Active Users (7d)"
            data={dauChartData}
            dataKeys={[{ key: "dau", label: "DAU" }]}
          />
        </Col>
        <Col xs={24} lg={8}>
          <DonutChart
            title="Active Subscriptions by Plan"
            data={planChartData}
          />
        </Col>
      </Row>

      {/* Charts Row 2 */}
      <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
        <Col xs={24} lg={12}>
          <StackedBar
            title="Notifications by Channel"
            data={notifChartData}
            dataKeys={[
              { key: "delivered", label: "Delivered" },
              { key: "sent", label: "Sent" },
              { key: "failed", label: "Failed" },
              { key: "pending", label: "Pending" },
            ]}
          />
        </Col>
        <Col xs={24} lg={12}>
          <TrendLine
            title="MAU"
            data={[
              {
                date: "This Month",
                mau: overview?.activeUsersMonth ?? 0,
              },
            ]}
            dataKeys={[{ key: "mau", label: "Monthly Active Users" }]}
          />
        </Col>
      </Row>

      {/* Quick Actions */}
      <Row>
        <Col span={24}>
          <QuickActions />
        </Col>
      </Row>
    </div>
  );
};
