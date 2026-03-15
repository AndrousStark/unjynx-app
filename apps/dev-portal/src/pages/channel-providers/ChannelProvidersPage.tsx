// ============================================================
// R7 - Channel Providers Page
// ============================================================

import {
  Typography,
  Space,
  Row,
  Col,
  Card,
  Descriptions,
  Tag,
  Progress,
  Statistic,
  Spin,
  Alert,
} from "antd";
import {
  MessageOutlined,
  CheckCircleOutlined,
  WarningOutlined,
} from "@ant-design/icons";
import { useCustom } from "@refinedev/core";
import { StatusIndicator } from "@/components/common/StatusIndicator";
import { MetricPanel } from "@/components/charts/MetricPanel";
import type { ProviderStatus } from "@/types";
import { COLORS, CHANNEL_INFO, REFRESH_INTERVALS } from "@/utils/constants";
import { formatNumber, formatPercent } from "@/utils/formatters";

const qualityColorMap: Record<string, string> = {
  green: "#10B981",
  yellow: "#F59E0B",
  red: "#EF4444",
};

const credentialsTagColor: Record<string, string> = {
  configured: "success",
  missing: "error",
  expired: "warning",
};

interface ProviderCardProps {
  readonly channel: string;
  readonly credentials?: "configured" | "missing" | "expired";
  readonly children: React.ReactNode;
}

const ProviderCard: React.FC<ProviderCardProps> = ({ channel, credentials, children }) => {
  const info = CHANNEL_INFO[channel];
  return (
    <Card
      title={
        <Space>
          <div
            style={{
              width: 28,
              height: 28,
              borderRadius: 6,
              background: info?.color ?? COLORS.violet,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <MessageOutlined style={{ color: "#fff", fontSize: 14 }} />
          </div>
          <div>
            <Typography.Text strong style={{ color: COLORS.white }}>
              {info?.label ?? channel}
            </Typography.Text>
            <Typography.Text
              style={{ color: "#6B7280", fontSize: 11, display: "block" }}
            >
              {info?.provider ?? ""}
            </Typography.Text>
          </div>
          {credentials && (
            <Tag
              color={credentialsTagColor[credentials] ?? "default"}
              style={{ marginLeft: 8, fontSize: 10 }}
            >
              {credentials}
            </Tag>
          )}
        </Space>
      }
      style={{
        background: "#1A1528",
        border: "1px solid #2D2640",
        height: "100%",
      }}
      styles={{
        header: { borderBottom: "1px solid #2D2640" },
        body: { padding: 16 },
      }}
    >
      {children}
    </Card>
  );
};

const NotConfiguredMessage: React.FC = () => (
  <Typography.Text style={{ color: "#9CA3AF", fontStyle: "italic" }}>
    Not configured
  </Typography.Text>
);

const NoDataMessage: React.FC = () => (
  <Typography.Text style={{ color: "#9CA3AF", fontStyle: "italic" }}>
    No data available
  </Typography.Text>
);

// --- Helpers to safely extract details fields ---
const num = (v: unknown): number => (typeof v === "number" ? v : 0);
const str = (v: unknown): string => (typeof v === "string" ? v : "");
const bool = (v: unknown): boolean => (typeof v === "boolean" ? v : false);

// --- Per-channel card content ---

const TelegramContent: React.FC<{ readonly provider: ProviderStatus }> = ({ provider }) => {
  const d = provider.details;
  return (
    <Space direction="vertical" size={12} style={{ width: "100%" }}>
      <Descriptions column={2} size="small">
        <Descriptions.Item label="Bot">
          <Typography.Text code>{str(d.botUsername) || "--"}</Typography.Text>
        </Descriptions.Item>
        <Descriptions.Item label="Status">
          <StatusIndicator
            status={provider.apiHealthy ? "healthy" : "down"}
            size="small"
          />
        </Descriptions.Item>
        <Descriptions.Item label="Webhook">
          <Typography.Text
            code
            ellipsis
            style={{ maxWidth: 200, fontSize: 11, display: "block" }}
          >
            {str(d.webhookUrl) || "--"}
          </Typography.Text>
        </Descriptions.Item>
      </Descriptions>
      <Row gutter={16}>
        <Col span={12}>
          <Statistic
            title={<span style={{ color: "#9CA3AF", fontSize: 11 }}>Messages (24h)</span>}
            value={formatNumber(num(d.messagesSent24h))}
            valueStyle={{ color: COLORS.white, fontSize: 16 }}
          />
        </Col>
        <Col span={12}>
          <Statistic
            title={<span style={{ color: "#9CA3AF", fontSize: 11 }}>Bot Username</span>}
            value={str(d.botUsername) || "--"}
            valueStyle={{ color: COLORS.white, fontSize: 16 }}
          />
        </Col>
      </Row>
    </Space>
  );
};

const WhatsAppContent: React.FC<{ readonly provider: ProviderStatus }> = ({ provider }) => {
  const d = provider.details;
  const templatesApproved = num(d.templatesApproved);
  const messageQuota = num(d.messageQuota);
  const messagesUsed = num(d.messagesUsed24h);
  const quotaPercent = messageQuota > 0 ? (messagesUsed / messageQuota) * 100 : 0;

  return (
    <Space direction="vertical" size={12} style={{ width: "100%" }}>
      <Descriptions column={2} size="small">
        <Descriptions.Item label="API Health">
          <StatusIndicator
            status={provider.apiHealthy ? "healthy" : "down"}
            size="small"
          />
        </Descriptions.Item>
        <Descriptions.Item label="Quality">
          <Tag
            color={qualityColorMap[str(d.qualityRating)] ?? "#9CA3AF"}
            style={{ textTransform: "uppercase" }}
          >
            {str(d.qualityRating) || "--"}
          </Tag>
        </Descriptions.Item>
      </Descriptions>
      <Row gutter={16}>
        <Col span={8}>
          <Statistic
            title={<span style={{ color: "#9CA3AF", fontSize: 11 }}>Approved</span>}
            value={templatesApproved}
            prefix={<CheckCircleOutlined style={{ color: COLORS.healthy }} />}
            valueStyle={{ color: COLORS.white, fontSize: 16 }}
          />
        </Col>
        <Col span={8}>
          <Statistic
            title={<span style={{ color: "#9CA3AF", fontSize: 11 }}>Pending</span>}
            value={num(d.pendingTemplates)}
            prefix={<WarningOutlined style={{ color: COLORS.warning }} />}
            valueStyle={{ color: COLORS.white, fontSize: 16 }}
          />
        </Col>
        <Col span={8}>
          <Statistic
            title={<span style={{ color: "#9CA3AF", fontSize: 11 }}>Quota Used</span>}
            value={formatPercent(quotaPercent, 0)}
            valueStyle={{ color: COLORS.white, fontSize: 16 }}
          />
        </Col>
      </Row>
      {messageQuota > 0 && (
        <Progress
          percent={Math.round(quotaPercent)}
          strokeColor={CHANNEL_INFO.whatsapp.color}
          trailColor="#2D2640"
          format={() => `${messagesUsed}/${messageQuota}`}
        />
      )}
    </Space>
  );
};

const InstagramContent: React.FC<{ readonly provider: ProviderStatus }> = ({ provider }) => {
  const d = provider.details;
  return (
    <Space direction="vertical" size={12} style={{ width: "100%" }}>
      <Descriptions column={2} size="small">
        <Descriptions.Item label="API Status">
          <StatusIndicator
            status={provider.apiHealthy ? "healthy" : "down"}
            size="small"
          />
        </Descriptions.Item>
      </Descriptions>
      <Row gutter={16}>
        <Col span={8}>
          <Statistic
            title={<span style={{ color: "#9CA3AF", fontSize: 11 }}>Active Windows</span>}
            value={num(d.activeWindows)}
            valueStyle={{ color: COLORS.white, fontSize: 16 }}
          />
        </Col>
        <Col span={8}>
          <Statistic
            title={<span style={{ color: "#9CA3AF", fontSize: 11 }}>Pending Requests</span>}
            value={num(d.pendingFriendRequests)}
            valueStyle={{ color: COLORS.warning, fontSize: 16 }}
          />
        </Col>
        <Col span={8}>
          <Statistic
            title={<span style={{ color: "#9CA3AF", fontSize: 11 }}>Expiring in 1h</span>}
            value={num(d.windowExpiringIn1h)}
            valueStyle={{ color: COLORS.white, fontSize: 16 }}
          />
        </Col>
      </Row>
    </Space>
  );
};

const SmsContent: React.FC<{ readonly provider: ProviderStatus }> = ({ provider }) => {
  const d = provider.details;
  const dltRegistered = bool(d.dltRegistered);
  const dndFilterRate = num(d.dndFilterRate);
  const balance = num(d.balance);

  return (
    <Space direction="vertical" size={12} style={{ width: "100%" }}>
      <Descriptions column={2} size="small">
        <Descriptions.Item label="DLT Registration">
          <Tag color={dltRegistered ? "success" : "error"}>
            {dltRegistered ? "Registered" : "Not Registered"}
          </Tag>
        </Descriptions.Item>
        <Descriptions.Item label="DND Filter Rate">
          <Tag color={dndFilterRate > 20 ? "error" : "warning"}>
            {formatPercent(dndFilterRate)}
          </Tag>
        </Descriptions.Item>
      </Descriptions>
      <Row gutter={16}>
        <Col span={8}>
          <Statistic
            title={<span style={{ color: "#9CA3AF", fontSize: 11 }}>Status</span>}
            value={provider.apiHealthy ? "Healthy" : "Down"}
            valueStyle={{ color: provider.apiHealthy ? COLORS.healthy : COLORS.critical, fontSize: 16 }}
          />
        </Col>
        <Col span={8}>
          <Statistic
            title={<span style={{ color: "#9CA3AF", fontSize: 11 }}>Balance</span>}
            value={balance > 0 ? formatNumber(balance) : "--"}
            valueStyle={{ color: COLORS.white, fontSize: 16 }}
          />
        </Col>
        <Col span={8}>
          <Statistic
            title={<span style={{ color: "#9CA3AF", fontSize: 11 }}>DND Rate</span>}
            value={formatPercent(dndFilterRate)}
            valueStyle={{ color: COLORS.white, fontSize: 14 }}
          />
        </Col>
      </Row>
    </Space>
  );
};

const EmailContent: React.FC<{ readonly provider: ProviderStatus }> = ({ provider }) => {
  const d = provider.details;
  const domainReputation = num(d.domainReputation);
  const bounceRate = num(d.bounceRate);
  const spamComplaintRate = num(d.spamComplaintRate);
  const senderScore = num(d.senderScore);

  return (
    <Space direction="vertical" size={12} style={{ width: "100%" }}>
      <Row gutter={16}>
        <Col span={6}>
          <MetricPanel
            title="Reputation"
            value={domainReputation}
            suffix="/100"
            progress={domainReputation}
            thresholds={{ warning: 80, critical: 60, inverted: true }}
          />
        </Col>
        <Col span={6}>
          <MetricPanel
            title="Bounce Rate"
            value={bounceRate}
            suffix="%"
            progress={bounceRate}
            thresholds={{ warning: 3, critical: 5 }}
          />
        </Col>
        <Col span={6}>
          <MetricPanel
            title="Spam Rate"
            value={spamComplaintRate}
            suffix="%"
            progress={spamComplaintRate * 10}
            thresholds={{ warning: 1, critical: 5 }}
          />
        </Col>
        <Col span={6}>
          <MetricPanel
            title="Sender Score"
            value={senderScore}
            suffix="/100"
            progress={senderScore}
            thresholds={{ warning: 80, critical: 60, inverted: true }}
          />
        </Col>
      </Row>
    </Space>
  );
};

const PushContent: React.FC<{ readonly provider: ProviderStatus }> = ({ provider }) => {
  const d = provider.details;
  const tokenValidityRate = num(d.tokenValidityRate);
  const silentPushSuccessRate = num(d.silentPushSuccessRate);

  return (
    <Space direction="vertical" size={12} style={{ width: "100%" }}>
      <Row gutter={16}>
        <Col span={12}>
          <MetricPanel
            title="Token Validity"
            value={tokenValidityRate}
            suffix="%"
            progress={tokenValidityRate}
            thresholds={{ warning: 90, critical: 80, inverted: true }}
          />
        </Col>
        <Col span={12}>
          <MetricPanel
            title="Silent Push Success"
            value={silentPushSuccessRate}
            suffix="%"
            progress={silentPushSuccessRate}
            thresholds={{ warning: 95, critical: 90, inverted: true }}
          />
        </Col>
      </Row>
    </Space>
  );
};

const SlackContent: React.FC<{ readonly provider: ProviderStatus }> = ({ provider }) => {
  const d = provider.details;
  return (
    <Space direction="vertical" size={12} style={{ width: "100%" }}>
      <Descriptions column={2} size="small">
        <Descriptions.Item label="Bot Status">
          <StatusIndicator
            status={provider.apiHealthy ? "healthy" : "down"}
            size="small"
          />
        </Descriptions.Item>
      </Descriptions>
      <Row gutter={16}>
        <Col span={12}>
          <Statistic
            title={<span style={{ color: "#9CA3AF", fontSize: 11 }}>Workspaces</span>}
            value={num(d.workspaceConnections)}
            valueStyle={{ color: COLORS.white, fontSize: 16 }}
          />
        </Col>
        <Col span={12}>
          <Statistic
            title={<span style={{ color: "#9CA3AF", fontSize: 11 }}>Bot Status</span>}
            value={str(d.botStatus) || "--"}
            valueStyle={{ color: COLORS.white, fontSize: 16 }}
          />
        </Col>
      </Row>
    </Space>
  );
};

const DiscordContent: React.FC<{ readonly provider: ProviderStatus }> = ({ provider }) => {
  const d = provider.details;
  return (
    <Space direction="vertical" size={12} style={{ width: "100%" }}>
      <Descriptions column={2} size="small">
        <Descriptions.Item label="Bot Status">
          <StatusIndicator
            status={provider.apiHealthy ? "healthy" : "down"}
            size="small"
          />
        </Descriptions.Item>
      </Descriptions>
      <Row gutter={16}>
        <Col span={12}>
          <Statistic
            title={<span style={{ color: "#9CA3AF", fontSize: 11 }}>Servers</span>}
            value={num(d.serverConnections)}
            valueStyle={{ color: COLORS.white, fontSize: 16 }}
          />
        </Col>
        <Col span={12}>
          <Statistic
            title={<span style={{ color: "#9CA3AF", fontSize: 11 }}>Bot Status</span>}
            value={str(d.botStatus) || "--"}
            valueStyle={{ color: COLORS.white, fontSize: 16 }}
          />
        </Col>
      </Row>
    </Space>
  );
};

// --- Channel content renderer ---
const channelRenderers: Record<string, React.FC<{ readonly provider: ProviderStatus }>> = {
  telegram: TelegramContent,
  whatsapp: WhatsAppContent,
  instagram: InstagramContent,
  sms: SmsContent,
  email: EmailContent,
  push: PushContent,
  slack: SlackContent,
  discord: DiscordContent,
};

const CHANNEL_ORDER = [
  "telegram",
  "whatsapp",
  "instagram",
  "sms",
  "email",
  "push",
  "slack",
  "discord",
] as const;

export const ChannelProvidersPage: React.FC = () => {
  const { data: providersData, isLoading, isError } = useCustom({
    url: "channel-providers",
    method: "get",
    queryOptions: {
      refetchInterval: REFRESH_INTERVALS.normal,
      queryKey: ["channel-providers"],
    },
  });

  const providers = (providersData?.data as ProviderStatus[] | undefined) ?? [];

  return (
    <Spin spinning={isLoading} size="large">
      <Space direction="vertical" size={24} style={{ width: "100%" }}>
        <Typography.Title level={3} style={{ margin: 0, color: COLORS.white }}>
          Channel Providers
        </Typography.Title>

        {isError && (
          <Alert
            type="error"
            message="Failed to load channel provider data"
            description="Provider status is unavailable. Check backend connectivity."
            showIcon
            closable
          />
        )}

        <Row gutter={[16, 16]}>
          {CHANNEL_ORDER.map((channel) => {
            const provider = providers.find((p) => p.channel === channel);
            const ContentRenderer = channelRenderers[channel];

            return (
              <Col xs={24} lg={12} key={channel}>
                <ProviderCard
                  channel={channel}
                  credentials={provider?.credentials}
                >
                  {!provider ? (
                    <NoDataMessage />
                  ) : provider.credentials === "missing" ? (
                    <NotConfiguredMessage />
                  ) : ContentRenderer ? (
                    <ContentRenderer provider={provider} />
                  ) : (
                    <NoDataMessage />
                  )}
                </ProviderCard>
              </Col>
            );
          })}
        </Row>
      </Space>
    </Spin>
  );
};
