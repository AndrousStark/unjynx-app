import React from "react";
import {
  Card,
  Typography,
  Row,
  Col,
  Tag,
  Progress,
  Space,
  Button,
  Spin,
  Statistic,
} from "antd";
import {
  BellOutlined,
  MailOutlined,
  MessageOutlined,
  SendOutlined,
  ReloadOutlined,
} from "@ant-design/icons";
import { useCustom, useNavigation } from "@refinedev/core";
import { StackedBar } from "../../components/charts/StackedBar";
import { API_BASE_URL, API_ADMIN_PREFIX, BRAND_COLORS } from "../../utils/constants";
import { formatNumber } from "../../utils/formatters";

const { Title, Text } = Typography;

interface ChannelStats {
  channel: string;
  total: number;
  sent: number;
  delivered: number;
  failed: number;
  pending: number;
}

interface QueueStatus {
  pending: number;
  queued: number;
  sent: number;
  failed: number;
  total: number;
}

function channelIcon(channel: string): React.ReactNode {
  const iconMap: Record<string, React.ReactNode> = {
    push: <BellOutlined />,
    email: <MailOutlined />,
    sms: <MessageOutlined />,
    telegram: <SendOutlined />,
    whatsapp: <MessageOutlined />,
    instagram: <MessageOutlined />,
    slack: <MessageOutlined />,
    discord: <MessageOutlined />,
  };
  return iconMap[channel] ?? <BellOutlined />;
}

function healthStatus(stats: ChannelStats): { status: string; color: string } {
  if (stats.total === 0) return { status: "no data", color: BRAND_COLORS.warning };
  const successRate = ((stats.delivered + stats.sent) / stats.total) * 100;
  if (successRate >= 95) return { status: "healthy", color: BRAND_COLORS.success };
  if (successRate >= 80) return { status: "degraded", color: BRAND_COLORS.warning };
  return { status: "down", color: BRAND_COLORS.error };
}

export const NotificationDashboard: React.FC = () => {
  const { push } = useNavigation();

  const { data: channelData, isLoading: channelLoading, refetch: refetchChannels } =
    useCustom<ChannelStats[]>({
      url: `${API_BASE_URL}${API_ADMIN_PREFIX}/notifications/channel-health`,
      method: "get",
    });

  const { data: queueData, refetch: refetchQueue } = useCustom<QueueStatus>({
    url: `${API_BASE_URL}${API_ADMIN_PREFIX}/notifications/queue-status`,
    method: "get",
  });

  const channels = (channelData?.data as unknown as ChannelStats[]) ?? [];
  const queue = (queueData?.data as unknown as QueueStatus) ?? {
    pending: 0,
    queued: 0,
    sent: 0,
    failed: 0,
    total: 0,
  };

  const handleRefresh = () => {
    refetchChannels();
    refetchQueue();
  };

  if (channelLoading) {
    return (
      <div style={{ textAlign: "center", padding: 80 }}>
        <Spin size="large" />
      </div>
    );
  }

  const channelChartData = channels.map((ch) => ({
    channel: ch.channel,
    delivered: ch.delivered,
    sent: ch.sent,
    failed: ch.failed,
    pending: ch.pending,
  }));

  return (
    <div>
      <Row justify="space-between" align="middle" style={{ marginBottom: 24 }}>
        <Col>
          <Title level={3} style={{ margin: 0 }}>
            Notification Management
          </Title>
        </Col>
        <Col>
          <Space>
            <Button onClick={() => push("/notifications/failed")}>
              Failed Notifications
            </Button>
            <Button icon={<ReloadOutlined />} onClick={handleRefresh}>
              Refresh
            </Button>
          </Space>
        </Col>
      </Row>

      {/* Queue Summary */}
      <Row gutter={[12, 12]} style={{ marginBottom: 24 }}>
        <Col xs={12} sm={6}>
          <Card bordered={false} size="small">
            <Statistic title="Total" value={queue.total} />
          </Card>
        </Col>
        <Col xs={12} sm={6}>
          <Card bordered={false} size="small">
            <Statistic title="Pending" value={queue.pending + queue.queued} valueStyle={{ color: "#1890ff" }} />
          </Card>
        </Col>
        <Col xs={12} sm={6}>
          <Card bordered={false} size="small">
            <Statistic title="Sent" value={queue.sent} valueStyle={{ color: BRAND_COLORS.success }} />
          </Card>
        </Col>
        <Col xs={12} sm={6}>
          <Card bordered={false} size="small">
            <Statistic title="Failed" value={queue.failed} valueStyle={{ color: BRAND_COLORS.error }} />
          </Card>
        </Col>
      </Row>

      {/* Channel Health Cards */}
      <Title level={5} style={{ marginBottom: 12 }}>
        Channel Health
      </Title>
      <Row gutter={[12, 12]} style={{ marginBottom: 24 }}>
        {channels.map((ch) => {
          const health = healthStatus(ch);
          const successRate =
            ch.total > 0
              ? ((ch.delivered + ch.sent) / ch.total) * 100
              : 0;

          return (
            <Col xs={12} sm={8} md={6} key={ch.channel}>
              <Card
                bordered={false}
                size="small"
                style={{ borderLeft: `3px solid ${health.color}` }}
              >
                <Space direction="vertical" size={4} style={{ width: "100%" }}>
                  <Space>
                    {channelIcon(ch.channel)}
                    <Text strong style={{ textTransform: "capitalize" }}>
                      {ch.channel}
                    </Text>
                    <Tag
                      color={
                        health.status === "healthy"
                          ? "success"
                          : health.status === "degraded"
                            ? "warning"
                            : "error"
                      }
                    >
                      {health.status}
                    </Tag>
                  </Space>
                  <Progress
                    percent={Math.round(successRate * 10) / 10}
                    size="small"
                    status={successRate < 90 ? "exception" : "success"}
                    format={(p) => `${p}%`}
                  />
                  <Text type="secondary" style={{ fontSize: 11 }}>
                    Total: {formatNumber(ch.total)} | Failed: {ch.failed}
                  </Text>
                </Space>
              </Card>
            </Col>
          );
        })}
        {channels.length === 0 && (
          <Col span={24}>
            <Card bordered={false}>
              <Text type="secondary">No notification data yet. Channels will appear once notifications are sent.</Text>
            </Card>
          </Col>
        )}
      </Row>

      {/* Chart */}
      <Row gutter={[16, 16]}>
        <Col span={24}>
          <StackedBar
            title="Delivery Status by Channel"
            data={channelChartData}
            dataKeys={[
              { key: "delivered", label: "Delivered" },
              { key: "sent", label: "Sent" },
              { key: "failed", label: "Failed" },
              { key: "pending", label: "Pending" },
            ]}
          />
        </Col>
      </Row>
    </div>
  );
};
