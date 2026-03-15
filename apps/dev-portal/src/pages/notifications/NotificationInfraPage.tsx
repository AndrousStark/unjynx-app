// ============================================================
// R5 - Notification Infrastructure Page
// ============================================================

import { useState, useMemo } from "react";
import {
  Typography,
  Space,
  Row,
  Col,
  Card,
  Table,
  Tag,
  Select,
  Statistic,
  Spin,
  Alert,
} from "antd";
import {
  BellOutlined,
  CheckCircleOutlined,
  DollarOutlined,
  ThunderboltOutlined,
} from "@ant-design/icons";
import { useCustom } from "@refinedev/core";
import { StatusIndicator } from "@/components/common/StatusIndicator";
import { MetricPanel } from "@/components/charts/MetricPanel";
import { TimeSeriesChart } from "@/components/charts/TimeSeriesChart";
import { ServiceCard } from "@/components/charts/ServiceCard";
import type { ChannelHealth, NotificationTemplate } from "@/types";
import { COLORS, CHANNEL_INFO, REFRESH_INTERVALS } from "@/utils/constants";
import {
  formatPercent,
  formatNumber,
  formatCurrency,
  formatTimestamp,
  getStatusColor,
} from "@/utils/formatters";

// --- Types for API responses ---

interface HealthApiItem {
  readonly channel: string;
  readonly provider: string;
  readonly status: "healthy" | "degraded" | "down";
  readonly deliveryRate: number;
  readonly messagesSentToday: number;
  readonly costToday: number;
  readonly lastCheckedAt: string;
  readonly details: Record<string, unknown>;
}

interface QueueApiItem {
  readonly queue: string;
  readonly active: number;
  readonly waiting: number;
  readonly delayed: number;
  readonly failed: number;
  readonly completed: number;
  readonly processingRate: number;
}

// --- Mock template data (no backend endpoint) ---

const mockTemplates: NotificationTemplate[] = [
  { id: "t1", name: "task_reminder", channel: "whatsapp", status: "approved", lastModified: "2026-03-10T10:00:00Z", version: 3 },
  { id: "t2", name: "task_overdue", channel: "whatsapp", status: "approved", lastModified: "2026-03-09T14:00:00Z", version: 2 },
  { id: "t3", name: "daily_digest", channel: "email", status: "approved", lastModified: "2026-03-08T10:00:00Z", version: 5 },
  { id: "t4", name: "welcome_message", channel: "telegram", status: "approved", lastModified: "2026-03-05T10:00:00Z", version: 1 },
  { id: "t5", name: "otp_verification", channel: "sms", status: "pending", lastModified: "2026-03-11T08:00:00Z", version: 1 },
  { id: "t6", name: "friend_request", channel: "instagram", status: "pending", lastModified: "2026-03-11T09:00:00Z", version: 1 },
  { id: "t7", name: "team_task_assigned", channel: "slack", status: "approved", lastModified: "2026-03-07T10:00:00Z", version: 2 },
  { id: "t8", name: "achievement_unlock", channel: "push", status: "approved", lastModified: "2026-03-06T10:00:00Z", version: 4 },
];

// --- Helpers ---

const mapHealthToChannelHealth = (items: readonly HealthApiItem[]): readonly ChannelHealth[] =>
  items.map((item) => ({
    channel: item.channel as ChannelHealth["channel"],
    provider: item.provider,
    status: item.status,
    deliveryRate: item.deliveryRate,
    avgLatency:
      typeof item.details?.responseTimeMs === "number"
        ? item.details.responseTimeMs
        : typeof item.details?.avgLatency === "number"
          ? item.details.avgLatency
          : 0,
    lastCheck: item.lastCheckedAt,
  }));

export const NotificationInfraPage: React.FC = () => {
  const [period, setPeriod] = useState<"24h" | "7d" | "30d">("24h");

  // --- API calls ---

  const {
    data: healthData,
    isLoading: healthLoading,
    isError: healthError,
  } = useCustom<HealthApiItem[]>({
    url: "notifications/health",
    method: "get",
    queryOptions: {
      refetchInterval: REFRESH_INTERVALS.normal,
      queryKey: ["notif-health"],
    },
  });

  const {
    data: queueData,
    isLoading: queueLoading,
    isError: queueError,
  } = useCustom<QueueApiItem[]>({
    url: "notifications/queues",
    method: "get",
    queryOptions: {
      refetchInterval: REFRESH_INTERVALS.fast,
      queryKey: ["notif-queues"],
    },
  });

  // --- Derived data ---

  const healthItems: readonly HealthApiItem[] = useMemo(
    () => (healthData?.data as unknown as HealthApiItem[]) ?? [],
    [healthData],
  );

  const channelHealthList: readonly ChannelHealth[] = useMemo(
    () => mapHealthToChannelHealth(healthItems),
    [healthItems],
  );

  const queueItems: readonly QueueApiItem[] = useMemo(
    () => (queueData?.data as unknown as QueueApiItem[]) ?? [],
    [queueData],
  );

  // Overview metrics from health data
  const totalSentToday = useMemo(
    () => healthItems.reduce((s, h) => s + h.messagesSentToday, 0),
    [healthItems],
  );

  const totalCompleted = useMemo(
    () => queueItems.reduce((s, q) => s + q.completed, 0),
    [queueItems],
  );

  const totalFailed = useMemo(
    () => queueItems.reduce((s, q) => s + q.failed, 0),
    [queueItems],
  );

  const overallRate = useMemo(() => {
    const total = totalCompleted + totalFailed;
    return total > 0 ? (totalCompleted / total) * 100 : 0;
  }, [totalCompleted, totalFailed]);

  const totalDailyCost = useMemo(
    () => healthItems.reduce((s, h) => s + h.costToday, 0),
    [healthItems],
  );

  const totalMonthlyCost = totalDailyCost * 30;

  // Cost breakdown: channels with cost > 0 and free channels
  const paidChannels = useMemo(
    () => healthItems.filter((h) => h.costToday > 0),
    [healthItems],
  );

  const freeChannelCount = useMemo(
    () => healthItems.filter((h) => h.costToday === 0).length,
    [healthItems],
  );

  // Build a simple delivery-rate history from queue processing rates for the chart
  const deliveryChartData = useMemo(() => {
    if (queueItems.length === 0) return [];
    return queueItems.map((q) => ({
      time: q.queue,
      rate: q.completed + q.failed > 0
        ? (q.completed / (q.completed + q.failed)) * 100
        : 100,
    }));
  }, [queueItems]);

  const isLoading = healthLoading || queueLoading;

  return (
    <Spin spinning={isLoading} size="large">
      <Space direction="vertical" size={24} style={{ width: "100%" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <Typography.Title level={3} style={{ margin: 0, color: COLORS.white }}>
            Notification Infrastructure
          </Typography.Title>
          <Select
            value={period}
            onChange={setPeriod}
            size="small"
            style={{ width: 100 }}
            options={[
              { value: "24h", label: "Last 24h" },
              { value: "7d", label: "Last 7d" },
              { value: "30d", label: "Last 30d" },
            ]}
          />
        </div>

        {/* API error alerts */}
        {healthError && (
          <Alert
            message="Failed to load notification health data"
            description="Channel health information is unavailable. Check backend connectivity."
            type="error"
            showIcon
            closable
          />
        )}
        {queueError && (
          <Alert
            message="Failed to load queue data"
            description="Queue status information is unavailable. Check backend connectivity."
            type="error"
            showIcon
            closable
          />
        )}

        {/* Overview Metrics */}
        <Row gutter={[16, 16]}>
          <Col xs={12} sm={6}>
            <MetricPanel title="Total Sent Today" value={formatNumber(totalSentToday)} description={period} />
          </Col>
          <Col xs={12} sm={6}>
            <MetricPanel
              title="Overall Delivery Rate"
              value={overallRate.toFixed(1)}
              suffix="%"
              progress={overallRate}
              thresholds={{ warning: 95, critical: 90, inverted: true }}
            />
          </Col>
          <Col xs={12} sm={6}>
            <MetricPanel
              title="Failed"
              value={formatNumber(totalFailed)}
              description={
                totalCompleted + totalFailed > 0
                  ? `${formatPercent((totalFailed / (totalCompleted + totalFailed)) * 100)} failure rate`
                  : "No data"
              }
            />
          </Col>
          <Col xs={12} sm={6}>
            <MetricPanel
              title="Est. Monthly Cost"
              value={formatCurrency(totalMonthlyCost)}
            />
          </Col>
        </Row>

        {/* Channel Health Cards */}
        <Typography.Title level={5} style={{ color: COLORS.white, marginBottom: 0 }}>
          Channel Health
        </Typography.Title>
        <Row gutter={[16, 16]}>
          {channelHealthList.map((ch) => {
            const info = CHANNEL_INFO[ch.channel];
            return (
              <Col key={ch.channel} xs={24} sm={12} lg={6}>
                <ServiceCard
                  title={info?.label ?? ch.channel}
                  status={ch.status}
                  lastCheck={ch.lastCheck}
                  icon={
                    <div
                      style={{
                        width: 24,
                        height: 24,
                        borderRadius: 6,
                        background: info?.color ?? COLORS.violet,
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                      }}
                    >
                      <BellOutlined style={{ color: "#fff", fontSize: 12 }} />
                    </div>
                  }
                  metrics={[
                    { label: "Provider", value: ch.provider },
                    { label: "Delivery Rate", value: formatPercent(ch.deliveryRate) },
                    { label: "Avg Latency", value: ch.avgLatency > 0 ? `${ch.avgLatency}ms` : "N/A" },
                  ]}
                />
              </Col>
            );
          })}
        </Row>

        {/* Delivery Rate Chart + Cost Breakdown */}
        <Row gutter={[16, 16]}>
          <Col xs={24} lg={12}>
            <TimeSeriesChart
              title="Delivery Rates by Channel"
              data={deliveryChartData as unknown as Record<string, unknown>[]}
              series={[
                { dataKey: "rate", name: "Delivery Rate %" },
              ]}
              yAxisLabel="%"
              height={250}
            />
          </Col>
          <Col xs={24} lg={12}>
            <Card
              title={
                <Space>
                  <DollarOutlined style={{ color: COLORS.gold }} />
                  <span style={{ color: COLORS.white }}>Cost Breakdown</span>
                </Space>
              }
              style={{ background: "#1A1528", border: "1px solid #2D2640" }}
              styles={{ header: { borderBottom: "1px solid #2D2640" } }}
            >
              <Row gutter={[16, 12]}>
                {paidChannels.map((item) => {
                  const info = CHANNEL_INFO[item.channel];
                  const monthlyCost = item.costToday * 30;
                  const perMessage =
                    item.messagesSentToday > 0
                      ? item.costToday / item.messagesSentToday
                      : 0;
                  return (
                    <Col key={item.channel} xs={12} sm={8}>
                      <Statistic
                        title={
                          <span style={{ color: "#9CA3AF", fontSize: 12 }}>
                            {info?.label ?? item.channel}
                          </span>
                        }
                        value={monthlyCost}
                        prefix="$"
                        precision={2}
                        valueStyle={{ color: COLORS.white, fontSize: 18 }}
                        suffix={
                          <span style={{ fontSize: 11, color: "#6B7280" }}>/mo</span>
                        }
                      />
                      <Typography.Text style={{ color: "#6B7280", fontSize: 11 }}>
                        {formatCurrency(perMessage)}/msg
                      </Typography.Text>
                    </Col>
                  );
                })}
                <Col xs={12} sm={8}>
                  <Statistic
                    title={
                      <span style={{ color: "#9CA3AF", fontSize: 12 }}>
                        Free Channels
                      </span>
                    }
                    value={freeChannelCount}
                    suffix="channels"
                    valueStyle={{ color: COLORS.healthy, fontSize: 18 }}
                  />
                </Col>
              </Row>
            </Card>
          </Col>
        </Row>

        {/* Queue Status (from /notifications/queues) */}
        <Card
          title={
            <Space>
              <ThunderboltOutlined style={{ color: COLORS.gold }} />
              <span style={{ color: COLORS.white }}>Queue Status</span>
            </Space>
          }
          style={{ background: "#1A1528", border: "1px solid #2D2640" }}
          styles={{ header: { borderBottom: "1px solid #2D2640" } }}
        >
          <Table
            dataSource={queueItems as unknown as QueueApiItem[]}
            rowKey="queue"
            pagination={false}
            loading={queueLoading}
            columns={[
              {
                title: "Queue",
                dataIndex: "queue",
                render: (v: string) => {
                  const info = CHANNEL_INFO[v];
                  return (
                    <Tag color={info?.color ?? COLORS.violet}>{info?.label ?? v}</Tag>
                  );
                },
                width: 130,
              },
              {
                title: "Active",
                dataIndex: "active",
                render: (v: number) => (
                  <Typography.Text style={{ color: v > 0 ? COLORS.info : COLORS.white }}>
                    {formatNumber(v)}
                  </Typography.Text>
                ),
                width: 90,
              },
              {
                title: "Waiting",
                dataIndex: "waiting",
                render: (v: number) => formatNumber(v),
                width: 90,
              },
              {
                title: "Delayed",
                dataIndex: "delayed",
                render: (v: number) => (
                  <Typography.Text style={{ color: v > 0 ? COLORS.warning : COLORS.white }}>
                    {formatNumber(v)}
                  </Typography.Text>
                ),
                width: 90,
              },
              {
                title: "Failed",
                dataIndex: "failed",
                render: (v: number) => (
                  <Typography.Text style={{ color: v > 0 ? COLORS.critical : COLORS.white }}>
                    {formatNumber(v)}
                  </Typography.Text>
                ),
                width: 90,
              },
              {
                title: "Completed",
                dataIndex: "completed",
                render: (v: number) => formatNumber(v),
                width: 110,
              },
              {
                title: "Processing Rate",
                dataIndex: "processingRate",
                render: (v: number) => `${v.toFixed(1)} msg/s`,
                width: 140,
              },
            ]}
          />
        </Card>

        {/* Template Approval Status (mock - no backend endpoint) */}
        <Card
          title={
            <Space>
              <CheckCircleOutlined style={{ color: COLORS.healthy }} />
              <span style={{ color: COLORS.white }}>Template Status</span>
              <Tag color="default" style={{ marginLeft: 8 }}>Template management coming in v2</Tag>
            </Space>
          }
          style={{ background: "#1A1528", border: "1px solid #2D2640" }}
          styles={{ header: { borderBottom: "1px solid #2D2640" } }}
        >
          <Table
            dataSource={mockTemplates}
            rowKey="id"
            pagination={false}
            columns={[
              {
                title: "Template",
                dataIndex: "name",
                render: (v: string) => (
                  <Typography.Text code style={{ fontSize: 12 }}>
                    {v}
                  </Typography.Text>
                ),
              },
              {
                title: "Channel",
                dataIndex: "channel",
                render: (v: string) => {
                  const info = CHANNEL_INFO[v];
                  return (
                    <Tag color={info?.color ?? COLORS.violet}>{info?.label ?? v}</Tag>
                  );
                },
                width: 120,
              },
              {
                title: "Version",
                dataIndex: "version",
                render: (v: number) => `v${v}`,
                width: 80,
              },
              {
                title: "Status",
                dataIndex: "status",
                render: (v: string) => (
                  <Tag color={getStatusColor(v)}>{v}</Tag>
                ),
                width: 100,
              },
              {
                title: "Last Modified",
                dataIndex: "lastModified",
                render: (v: string) => formatTimestamp(v),
                width: 180,
              },
            ]}
          />
        </Card>

        {/* Provider Status Indicators (derived from health API) */}
        <Card
          title={
            <span style={{ color: COLORS.white }}>Provider API Health Checks</span>
          }
          style={{ background: "#1A1528", border: "1px solid #2D2640" }}
          styles={{ header: { borderBottom: "1px solid #2D2640" } }}
        >
          <Row gutter={[24, 16]}>
            {channelHealthList.map((ch) => {
              const info = CHANNEL_INFO[ch.channel];
              return (
                <Col key={ch.channel} xs={12} sm={8} md={6}>
                  <Space direction="vertical" size={4}>
                    <Typography.Text strong style={{ color: COLORS.white }}>
                      {info?.label ?? ch.channel}
                    </Typography.Text>
                    <Typography.Text style={{ color: "#6B7280", fontSize: 12 }}>
                      {info?.provider ?? ch.provider}
                    </Typography.Text>
                    <StatusIndicator status={ch.status} size="small" lastCheck={ch.lastCheck} />
                  </Space>
                </Col>
              );
            })}
          </Row>
        </Card>
      </Space>
    </Spin>
  );
};
