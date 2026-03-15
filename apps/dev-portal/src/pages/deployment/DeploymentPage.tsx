// ============================================================
// R4 - Deployment Page
// ============================================================

import { useState } from "react";
import {
  Typography,
  Space,
  Row,
  Col,
  Card,
  Table,
  Tag,
  Switch,
  Button,
  Input,
  Select,
  Slider,
  Popconfirm,
  message,
  Spin,
  Alert,
} from "antd";
import {
  CloudServerOutlined,
  RocketOutlined,
  FlagOutlined,
  SettingOutlined,
  EyeInvisibleOutlined,
  EyeOutlined,
  CopyOutlined,
} from "@ant-design/icons";
import { useCustom } from "@refinedev/core";
import { ServiceCard } from "@/components/charts/ServiceCard";
import type { DeployService, DeployHistory, FeatureFlag, EnvVariable } from "@/types";
import { COLORS } from "@/utils/constants";
import {
  formatTimestamp,
  formatRelativeTime,
  formatDuration,
  getStatusColor,
  maskSecret,
} from "@/utils/formatters";

// --- Backend response types ---
interface BackendService {
  readonly service: string;
  readonly status: "running" | "stopped" | "deploying";
  readonly version: string;
  readonly lastDeployedAt: string;
  readonly environment: string;
}

interface BackendDeployment {
  readonly id: string;
  readonly service: string;
  readonly commit: string;
  readonly deployer: string;
  readonly status: "success" | "failed" | "rolling_back" | "in_progress";
  readonly durationMs: number;
  readonly deployedAt: string;
  readonly environment: string;
}

// --- Map backend responses to frontend types ---
const mapService = (raw: BackendService): DeployService => ({
  name: raw.service,
  status: raw.status === "deploying" ? "deploying" : raw.status,
  version: raw.version,
  lastDeploy: raw.lastDeployedAt,
  environment: raw.environment,
});

const mapDeployment = (raw: BackendDeployment): DeployHistory => ({
  id: raw.id,
  service: raw.service,
  timestamp: raw.deployedAt,
  commit: raw.commit,
  deployer: raw.deployer,
  status: raw.status === "rolling_back" ? "rolled_back" : raw.status,
  duration: raw.durationMs,
});

// --- Mock data for tabs without backend endpoints ---
const mockFeatureFlags: FeatureFlag[] = [
  { id: "ff1", name: "ai_chat_enabled", description: "Enable AI chat feature for users", enabled: false, environment: "production", updatedAt: "2026-03-10T10:00:00Z", updatedBy: "admin" },
  { id: "ff2", name: "ghost_mode_v2", description: "Ghost mode with enhanced privacy controls", enabled: true, environment: "production", updatedAt: "2026-03-09T14:00:00Z", updatedBy: "developer" },
  { id: "ff3", name: "telegram_reminders", description: "Send reminders via Telegram", enabled: true, environment: "production", updatedAt: "2026-03-08T09:00:00Z", updatedBy: "admin" },
  { id: "ff4", name: "whatsapp_reminders", description: "Send reminders via WhatsApp/Gupshup", enabled: true, environment: "staging", updatedAt: "2026-03-11T08:00:00Z", updatedBy: "developer" },
  { id: "ff5", name: "energy_flow_engine", description: "ML-based energy prediction engine", enabled: false, environment: "development", updatedAt: "2026-03-05T10:00:00Z", updatedBy: "admin" },
  { id: "ff6", name: "canary_deploy", description: "Enable canary deployment pipeline", enabled: true, environment: "staging", updatedAt: "2026-03-11T07:00:00Z", updatedBy: "devops" },
];

const mockEnvVars: EnvVariable[] = [
  { key: "DATABASE_URL", value: "postgresql://user:pass@db:5432/unjynx", environment: "production", isSecret: true, updatedAt: "2026-02-20T10:00:00Z" },
  { key: "LOGTO_ENDPOINT", value: "https://auth.unjynx.com", environment: "production", isSecret: false, updatedAt: "2026-02-20T10:00:00Z" },
  { key: "LOGTO_APP_SECRET", value: "sk_live_abc123def456ghi789", environment: "production", isSecret: true, updatedAt: "2026-03-01T10:00:00Z" },
  { key: "SENDGRID_API_KEY", value: "SG.xxxxxxxxxxxxxxxxxxxxx", environment: "production", isSecret: true, updatedAt: "2026-03-05T10:00:00Z" },
  { key: "GUPSHUP_API_KEY", value: "gup_xxxxxxxxxxxxxxxxxxxx", environment: "production", isSecret: true, updatedAt: "2026-03-08T10:00:00Z" },
  { key: "OLLAMA_BASE_URL", value: "http://ollama:11434", environment: "production", isSecret: false, updatedAt: "2026-02-25T10:00:00Z" },
  { key: "MINIO_ENDPOINT", value: "http://minio:9000", environment: "production", isSecret: false, updatedAt: "2026-02-20T10:00:00Z" },
  { key: "NODE_ENV", value: "production", environment: "production", isSecret: false, updatedAt: "2026-02-15T10:00:00Z" },
];

export const DeploymentPage: React.FC = () => {
  const [revealedSecrets, setRevealedSecrets] = useState<Set<string>>(new Set());
  const [canaryPercent, setCanaryPercent] = useState(10);
  const [envFilter, setEnvFilter] = useState<string>("all");
  const [messageApi, contextHolder] = message.useMessage();

  // --- Fetch services from backend ---
  const {
    data: servicesResponse,
    isLoading: isLoadingServices,
  } = useCustom<BackendService[]>({
    url: "services",
    method: "get",
    queryOptions: {
      retry: 1,
      queryKey: ["services"],
    },
  });

  const services: DeployService[] = (servicesResponse?.data ?? []).map(mapService);

  // --- Fetch deployment history from backend ---
  const {
    data: deploymentsResponse,
    isLoading: isLoadingDeployments,
  } = useCustom<BackendDeployment[]>({
    url: "deployments",
    method: "get",
    queryOptions: {
      retry: 1,
      queryKey: ["deployments"],
    },
  });

  const deployHistory: DeployHistory[] = (deploymentsResponse?.data ?? []).map(mapDeployment);

  const toggleSecret = (key: string) => {
    setRevealedSecrets((prev) => {
      const next = new Set(prev);
      if (next.has(key)) {
        next.delete(key);
      } else {
        next.add(key);
      }
      return next;
    });
  };

  const filteredFlags =
    envFilter === "all"
      ? mockFeatureFlags
      : mockFeatureFlags.filter((f) => f.environment === envFilter);

  return (
    <Space direction="vertical" size={24} style={{ width: "100%" }}>
      {contextHolder}
      <Typography.Title level={3} style={{ margin: 0, color: COLORS.white }}>
        Deployment
      </Typography.Title>

      {/* Service Status Cards */}
      <Spin spinning={isLoadingServices}>
        <Row gutter={[16, 16]}>
          {services.map((svc) => (
            <Col key={svc.name} xs={24} sm={12} lg={6}>
              <ServiceCard
                title={svc.name}
                status={svc.status === "running" ? "healthy" : svc.status === "error" ? "down" : "degraded"}
                lastCheck={svc.lastDeploy}
                icon={<CloudServerOutlined style={{ color: COLORS.violet }} />}
                metrics={[
                  { label: "Version", value: svc.version },
                  { label: "Environment", value: svc.environment },
                  { label: "Last Deploy", value: formatRelativeTime(svc.lastDeploy) },
                ]}
              />
            </Col>
          ))}
          {!isLoadingServices && services.length === 0 && (
            <Col span={24}>
              <Card style={{ background: "#1A1528", border: "1px solid #2D2640", textAlign: "center", padding: 24 }}>
                <Typography.Text style={{ color: "#6B7280" }}>
                  No services found. The backend may not be reachable.
                </Typography.Text>
              </Card>
            </Col>
          )}
        </Row>
      </Spin>

      {/* Deploy History */}
      <Card
        title={
          <Space>
            <RocketOutlined style={{ color: COLORS.gold }} />
            <span style={{ color: COLORS.white }}>Deploy History</span>
          </Space>
        }
        style={{ background: "#1A1528", border: "1px solid #2D2640" }}
        styles={{ header: { borderBottom: "1px solid #2D2640" } }}
      >
        <Table
          dataSource={deployHistory}
          rowKey="id"
          pagination={{ pageSize: 10 }}
          loading={isLoadingDeployments}
          columns={[
            {
              title: "Service",
              dataIndex: "service",
              render: (v: string) => <Tag>{v}</Tag>,
              width: 140,
            },
            {
              title: "Timestamp",
              dataIndex: "timestamp",
              render: (v: string) => formatTimestamp(v),
              width: 180,
            },
            {
              title: "Commit",
              dataIndex: "commit",
              render: (v: string) => (
                <Typography.Text code style={{ fontSize: 12 }}>
                  {v}
                </Typography.Text>
              ),
              width: 100,
            },
            {
              title: "Deployer",
              dataIndex: "deployer",
              render: (v: string) => <Typography.Text>{v}</Typography.Text>,
            },
            {
              title: "Status",
              dataIndex: "status",
              render: (v: string) => (
                <Tag color={getStatusColor(v)}>{v.replace("_", " ")}</Tag>
              ),
              width: 120,
            },
            {
              title: "Duration",
              dataIndex: "duration",
              render: (v: number) => formatDuration(v),
              width: 100,
            },
          ]}
        />
      </Card>

      {/* Feature Flags */}
      <Card
        title={
          <Space>
            <FlagOutlined style={{ color: COLORS.violet }} />
            <span style={{ color: COLORS.white }}>Feature Flags</span>
          </Space>
        }
        extra={
          <Select
            value={envFilter}
            onChange={setEnvFilter}
            size="small"
            style={{ width: 140 }}
            options={[
              { value: "all", label: "All Environments" },
              { value: "production", label: "Production" },
              { value: "staging", label: "Staging" },
              { value: "development", label: "Development" },
            ]}
          />
        }
        style={{ background: "#1A1528", border: "1px solid #2D2640" }}
        styles={{ header: { borderBottom: "1px solid #2D2640" } }}
      >
        <Space direction="vertical" size={12} style={{ width: "100%" }}>
          <Alert
            message="Feature flag management is handled via admin panel"
            type="info"
            showIcon
            style={{ background: "#1A1528", border: "1px solid #2D2640" }}
          />
          <Table
            dataSource={filteredFlags}
            rowKey="id"
            pagination={false}
            columns={[
              {
                title: "Flag",
                dataIndex: "name",
                render: (v: string) => (
                  <Typography.Text code style={{ fontSize: 12 }}>
                    {v}
                  </Typography.Text>
                ),
              },
              { title: "Description", dataIndex: "description" },
              {
                title: "Environment",
                dataIndex: "environment",
                render: (v: string) => (
                  <Tag color={v === "production" ? "red" : v === "staging" ? "orange" : "blue"}>
                    {v}
                  </Tag>
                ),
                width: 120,
              },
              {
                title: "Enabled",
                dataIndex: "enabled",
                render: (v: boolean, record: FeatureFlag) => (
                  <Switch
                    checked={v}
                    size="small"
                    onChange={() => messageApi.info(`Flag ${record.name} toggled`)}
                  />
                ),
                width: 80,
              },
              {
                title: "Updated",
                dataIndex: "updatedAt",
                render: (v: string) => formatRelativeTime(v),
                width: 120,
              },
              {
                title: "By",
                dataIndex: "updatedBy",
                width: 100,
              },
            ]}
          />
        </Space>
      </Card>

      {/* Environment Variables */}
      <Card
        title={
          <Space>
            <SettingOutlined style={{ color: COLORS.gold }} />
            <span style={{ color: COLORS.white }}>Environment Variables</span>
          </Space>
        }
        style={{ background: "#1A1528", border: "1px solid #2D2640" }}
        styles={{ header: { borderBottom: "1px solid #2D2640" } }}
      >
        <Space direction="vertical" size={12} style={{ width: "100%" }}>
          <Alert
            message="Server environment preview (read-only)"
            type="info"
            showIcon
            style={{ background: "#1A1528", border: "1px solid #2D2640" }}
          />
          <Table
            dataSource={mockEnvVars}
            rowKey="key"
            pagination={false}
            columns={[
              {
                title: "Key",
                dataIndex: "key",
                render: (v: string) => (
                  <Typography.Text code style={{ fontSize: 12 }}>
                    {v}
                  </Typography.Text>
                ),
              },
              {
                title: "Value",
                key: "value",
                render: (_: unknown, record: EnvVariable) => (
                  <Space>
                    <Typography.Text
                      code
                      style={{ fontSize: 12, maxWidth: 300, display: "block" }}
                      ellipsis
                    >
                      {record.isSecret && !revealedSecrets.has(record.key)
                        ? maskSecret(record.value)
                        : record.value}
                    </Typography.Text>
                    {record.isSecret && (
                      <Button
                        type="text"
                        size="small"
                        icon={
                          revealedSecrets.has(record.key) ? (
                            <EyeInvisibleOutlined />
                          ) : (
                            <EyeOutlined />
                          )
                        }
                        onClick={() => toggleSecret(record.key)}
                      />
                    )}
                    <Button
                      type="text"
                      size="small"
                      icon={<CopyOutlined />}
                      onClick={() => {
                        navigator.clipboard.writeText(record.value);
                        messageApi.success("Copied");
                      }}
                    />
                  </Space>
                ),
              },
              {
                title: "Secret",
                dataIndex: "isSecret",
                render: (v: boolean) =>
                  v ? <Tag color="red">SECRET</Tag> : <Tag>PUBLIC</Tag>,
                width: 90,
              },
              {
                title: "Updated",
                dataIndex: "updatedAt",
                render: (v: string) => formatRelativeTime(v),
                width: 120,
              },
            ]}
          />
        </Space>
      </Card>

      {/* Canary Deployment Controls */}
      <Card
        title={
          <Space>
            <RocketOutlined style={{ color: COLORS.healthy }} />
            <span style={{ color: COLORS.white }}>Canary Deployment</span>
          </Space>
        }
        style={{ background: "#1A1528", border: "1px solid #2D2640" }}
        styles={{ header: { borderBottom: "1px solid #2D2640" } }}
      >
        <Row gutter={[24, 16]} align="middle">
          <Col xs={24} md={8}>
            <Typography.Text style={{ color: "#9CA3AF" }}>
              Canary Traffic Percentage
            </Typography.Text>
            <Slider
              value={canaryPercent}
              onChange={setCanaryPercent}
              min={0}
              max={100}
              step={5}
              marks={{ 0: "0%", 25: "25%", 50: "50%", 75: "75%", 100: "100%" }}
            />
          </Col>
          <Col xs={24} md={8}>
            <Space direction="vertical">
              <Input
                placeholder="Target version (e.g., v1.4.0)"
                size="small"
                style={{ width: 200 }}
              />
              <Input
                placeholder="Commit SHA"
                size="small"
                style={{ width: 200 }}
              />
            </Space>
          </Col>
          <Col xs={24} md={8}>
            <Space>
              <Popconfirm
                title={`Deploy canary at ${canaryPercent}%?`}
                onConfirm={() => messageApi.success("Canary deployment started")}
              >
                <Button type="primary" icon={<RocketOutlined />}>
                  Start Canary
                </Button>
              </Popconfirm>
              <Popconfirm
                title="Promote canary to 100%?"
                onConfirm={() => {
                  setCanaryPercent(100);
                  messageApi.success("Canary promoted to production");
                }}
              >
                <Button>Promote</Button>
              </Popconfirm>
              <Popconfirm
                title="Rollback canary deployment?"
                onConfirm={() => {
                  setCanaryPercent(0);
                  messageApi.warning("Canary rolled back");
                }}
              >
                <Button danger>Rollback</Button>
              </Popconfirm>
            </Space>
          </Col>
        </Row>
      </Card>
    </Space>
  );
};
