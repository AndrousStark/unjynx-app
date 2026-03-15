// ============================================================
// R1 - System Health Page
// ============================================================

import { useState, useMemo } from "react";
import { Row, Col, Typography, Space, Select, Timeline, Tag, Card, Spin, Alert } from "antd";
import {
  CloudServerOutlined,
  DatabaseOutlined,
  ThunderboltOutlined,
  UnorderedListOutlined,
  SafetyCertificateOutlined,
  InboxOutlined,
  RobotOutlined,
  WarningOutlined,
  InfoCircleOutlined,
} from "@ant-design/icons";
import { useCustom } from "@refinedev/core";
import { ServiceCard } from "@/components/charts/ServiceCard";
import { MetricPanel } from "@/components/charts/MetricPanel";
import { GrafanaEmbed } from "@/components/common/GrafanaEmbed";
import type {
  ServiceStatus,
  AlertEvent,
} from "@/types";
import { REFRESH_INTERVALS, GRAFANA_DASHBOARDS, COLORS } from "@/utils/constants";
import {
  formatPercent,
  formatDuration,
  formatRelativeTime,
  formatBytes,
  getStatusColor,
} from "@/utils/formatters";

// --- Backend response types ---

interface BackendServiceHealth {
  readonly name: string;
  readonly status: "healthy" | "degraded" | "down";
  readonly uptime: number; // milliseconds
  readonly responseTimeMs: number;
  readonly errorRate: number;
  readonly details?: Record<string, unknown>;
}

interface HealthResponse {
  readonly services: ReadonlyArray<BackendServiceHealth>;
  readonly overallStatus: "healthy" | "degraded" | "down";
}

// --- Name mapping from backend service names to display names ---

const SERVICE_DISPLAY_NAMES: Record<string, string> = {
  "api-server": "API Server",
  postgresql: "Database",
  "valkey-cache": "Cache (Valkey)",
  "bullmq-queue": "Queue (BullMQ)",
  "logto-auth": "Auth (Logto)",
  "minio-storage": "Storage (MinIO)",
  "ollama-ai": "AI (Ollama)",
};

// --- Helper: uptime score based on error rate (lower error = higher uptime) ---

const uptimeFromErrorRate = (errorRate: number): number => {
  // errorRate is a percentage (0-100); uptime = 100 - errorRate
  return Math.max(0, Math.min(100, 100 - errorRate));
};

const uptimeMsToHours = (uptimeMs: number): string => {
  const hours = uptimeMs / (1000 * 60 * 60);
  if (hours < 1) {
    const mins = uptimeMs / (1000 * 60);
    return `${mins.toFixed(0)}m`;
  }
  if (hours < 24) {
    return `${hours.toFixed(1)}h`;
  }
  const days = hours / 24;
  return `${days.toFixed(1)}d`;
};

// --- Helper to find a service by its backend name ---

const findService = (
  services: ReadonlyArray<BackendServiceHealth>,
  backendName: string
): BackendServiceHealth | undefined =>
  services.find((s) => s.name === backendName);

// --- Helper to safely read a numeric detail ---

const getDetail = (
  service: BackendServiceHealth | undefined,
  key: string
): number | undefined => {
  const val = service?.details?.[key];
  return typeof val === "number" ? val : undefined;
};

// --- Derive alerts from services with non-healthy status ---

const deriveAlerts = (
  services: ReadonlyArray<BackendServiceHealth>
): ReadonlyArray<AlertEvent> =>
  services
    .filter((s) => s.status !== "healthy")
    .map((s, idx) => ({
      id: `derived-${idx}`,
      severity: (s.status === "down" ? "critical" : "warning") as "critical" | "warning",
      service: SERVICE_DISPLAY_NAMES[s.name] ?? s.name,
      message:
        s.status === "down"
          ? `${SERVICE_DISPLAY_NAMES[s.name] ?? s.name} is currently down (response time: ${formatDuration(s.responseTimeMs)})`
          : `${SERVICE_DISPLAY_NAMES[s.name] ?? s.name} is degraded — error rate: ${formatPercent(s.errorRate)}, response time: ${formatDuration(s.responseTimeMs)}`,
      timestamp: new Date().toISOString(),
      resolved: false,
    }));

const severityColor: Record<string, string> = {
  critical: COLORS.critical,
  warning: COLORS.warning,
  info: COLORS.info,
};

export const SystemHealthPage: React.FC = () => {
  const [refreshInterval, setRefreshInterval] = useState(REFRESH_INTERVALS.normal);

  // Fetch real health data from backend
  const { data, isLoading, isError } = useCustom<HealthResponse>({
    url: "health",
    method: "get",
    queryOptions: {
      refetchInterval: refreshInterval,
      queryKey: ["system-health"],
    },
  });

  const healthData = data?.data;
  const services = useMemo(() => healthData?.services ?? [], [healthData]);
  const overallStatus: ServiceStatus = (healthData?.overallStatus as ServiceStatus) ?? "unknown";

  // Derive alerts from services with non-healthy status
  const alerts = useMemo(() => deriveAlerts(services), [services]);

  // Look up each service by backend name
  const apiService = findService(services, "api-server");
  const dbService = findService(services, "postgresql");
  const cacheService = findService(services, "valkey-cache");
  const queueService = findService(services, "bullmq-queue");
  const authService = findService(services, "logto-auth");
  const storageService = findService(services, "minio-storage");
  const aiService = findService(services, "ollama-ai");

  // Compute overview metrics from real data
  const overallUptimePercent = useMemo(() => {
    if (services.length === 0) return undefined;
    const avgPercent =
      services.reduce((sum, s) => sum + uptimeFromErrorRate(s.errorRate), 0) /
      services.length;
    return Math.min(avgPercent, 100);
  }, [services]);

  const avgErrorRate = useMemo(() => {
    if (services.length === 0) return undefined;
    return (
      services.reduce((sum, s) => sum + s.errorRate, 0) / services.length
    );
  }, [services]);

  return (
    <Spin spinning={isLoading} size="large">
      <Space direction="vertical" size={24} style={{ width: "100%" }}>
        {/* Error banner */}
        {isError && (
          <Alert
            type="error"
            message="Failed to load system health data"
            description="Could not connect to the health endpoint. Ensure the backend is running."
            showIcon
          />
        )}

        {/* Page header */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <Space align="center">
            <Typography.Title level={3} style={{ margin: 0, color: COLORS.white }}>
              System Health
            </Typography.Title>
            {!isLoading && (
              <Tag color={overallStatus === "healthy" ? "success" : overallStatus === "degraded" ? "warning" : overallStatus === "down" ? "error" : "default"}>
                {overallStatus.toUpperCase()}
              </Tag>
            )}
          </Space>
          <Space>
            <Typography.Text style={{ color: "#9CA3AF", fontSize: 12 }}>
              Refresh:
            </Typography.Text>
            <Select
              value={refreshInterval}
              onChange={setRefreshInterval}
              size="small"
              style={{ width: 120 }}
              options={[
                { value: REFRESH_INTERVALS.realtime, label: "5s (realtime)" },
                { value: REFRESH_INTERVALS.fast, label: "15s (fast)" },
                { value: REFRESH_INTERVALS.normal, label: "30s (normal)" },
                { value: REFRESH_INTERVALS.slow, label: "60s (slow)" },
              ]}
            />
          </Space>
        </div>

        {/* Overview metric panels */}
        <Row gutter={[16, 16]}>
          <Col xs={24} sm={12} md={6}>
            <MetricPanel
              title="Overall Uptime"
              value={overallUptimePercent != null ? Number(overallUptimePercent.toFixed(2)) : "--"}
              suffix={overallUptimePercent != null ? "%" : undefined}
              precision={2}
              progress={overallUptimePercent}
              thresholds={{ warning: 99, critical: 95, inverted: true }}
            />
          </Col>
          <Col xs={24} sm={12} md={6}>
            <MetricPanel
              title="API Latency"
              value={apiService ? `${apiService.responseTimeMs}` : "--"}
              suffix={apiService ? "ms" : undefined}
              description={apiService ? "Average response time" : "No data"}
            />
          </Col>
          <Col xs={24} sm={12} md={6}>
            <MetricPanel
              title="Error Rate"
              value={avgErrorRate != null ? Number(avgErrorRate.toFixed(2)) : "--"}
              suffix={avgErrorRate != null ? "%" : undefined}
              precision={2}
              progress={avgErrorRate}
              thresholds={{ warning: 1, critical: 5 }}
            />
          </Col>
          <Col xs={24} sm={12} md={6}>
            <MetricPanel
              title="Active Alerts"
              value={alerts.length}
              description={alerts.length === 0 ? "all clear" : "unresolved"}
            />
          </Col>
        </Row>

        {/* Grafana Embeds */}
        <Row gutter={[16, 16]}>
          <Col xs={24} lg={12}>
            <GrafanaEmbed
              dashboardUid={GRAFANA_DASHBOARDS.systemOverview}
              panelId={1}
              title="CPU & Memory Usage"
              height={300}
            />
          </Col>
          <Col xs={24} lg={12}>
            <GrafanaEmbed
              dashboardUid={GRAFANA_DASHBOARDS.apiMetrics}
              panelId={2}
              title="Request Latency Distribution"
              height={300}
            />
          </Col>
        </Row>

        {/* Service Cards */}
        <Typography.Title level={5} style={{ color: COLORS.white, marginBottom: 0 }}>
          Service Status
        </Typography.Title>
        <Row gutter={[16, 16]}>
          <Col xs={24} lg={12} xl={8}>
            <ServiceCard
              title="API Server"
              status={apiService?.status ?? "unknown"}
              icon={<CloudServerOutlined style={{ color: COLORS.violet }} />}
              metrics={[
                { label: "Uptime", value: apiService ? uptimeMsToHours(apiService.uptime) : "--" },
                { label: "Response", value: apiService ? formatDuration(apiService.responseTimeMs) : "--" },
                { label: "Error Rate", value: apiService ? formatPercent(apiService.errorRate) : "--" },
              ]}
            />
          </Col>
          <Col xs={24} lg={12} xl={8}>
            <ServiceCard
              title="Database (PostgreSQL)"
              status={dbService?.status ?? "unknown"}
              icon={<DatabaseOutlined style={{ color: COLORS.violet }} />}
              metrics={[
                { label: "Connections", value: getDetail(dbService, "activeConnections") ?? "--" },
                { label: "Response", value: dbService ? formatDuration(dbService.responseTimeMs) : "--" },
                { label: "DB Size", value: getDetail(dbService, "databaseSizeBytes") != null ? formatBytes(getDetail(dbService, "databaseSizeBytes")!) : "--" },
                { label: "Uptime", value: dbService ? uptimeMsToHours(dbService.uptime) : "--" },
              ]}
            />
          </Col>
          <Col xs={24} lg={12} xl={8}>
            <ServiceCard
              title="Cache (Valkey)"
              status={cacheService?.status ?? "unknown"}
              icon={<ThunderboltOutlined style={{ color: COLORS.gold }} />}
              metrics={[
                { label: "Memory", value: getDetail(cacheService, "usedMemoryBytes") != null ? formatBytes(getDetail(cacheService, "usedMemoryBytes")!) : (getDetail(cacheService, "memoryUsedMB") != null ? `${getDetail(cacheService, "memoryUsedMB")}MB` : "--") },
                { label: "Hit Rate", value: getDetail(cacheService, "hitRate") != null ? formatPercent(getDetail(cacheService, "hitRate")!) : "--" },
                { label: "Keys", value: getDetail(cacheService, "totalKeys") ?? getDetail(cacheService, "connectedClients") ?? "--" },
                { label: "Response", value: cacheService ? formatDuration(cacheService.responseTimeMs) : "--" },
              ]}
            />
          </Col>
          <Col xs={24} lg={12} xl={8}>
            <ServiceCard
              title="Queue (BullMQ)"
              status={queueService?.status ?? "unknown"}
              icon={<UnorderedListOutlined style={{ color: COLORS.violet }} />}
              metrics={[
                { label: "Active", value: getDetail(queueService, "active") ?? "--" },
                { label: "Waiting", value: getDetail(queueService, "waiting") ?? "--" },
                { label: "Failed", value: getDetail(queueService, "failed") ?? "--" },
                { label: "Completed", value: getDetail(queueService, "completed") ?? "--" },
              ]}
            />
          </Col>
          <Col xs={24} lg={12} xl={8}>
            <ServiceCard
              title="Auth (Logto)"
              status={authService?.status ?? "unknown"}
              icon={<SafetyCertificateOutlined style={{ color: COLORS.healthy }} />}
              metrics={[
                { label: "Response", value: authService ? formatDuration(authService.responseTimeMs) : "--" },
                { label: "Error Rate", value: authService ? formatPercent(authService.errorRate) : "--" },
                { label: "Uptime", value: authService ? uptimeMsToHours(authService.uptime) : "--" },
              ]}
            />
          </Col>
          <Col xs={24} lg={12} xl={8}>
            <ServiceCard
              title="Storage (MinIO)"
              status={storageService?.status ?? "unknown"}
              icon={<InboxOutlined style={{ color: COLORS.violet }} />}
              metrics={[
                { label: "Buckets", value: getDetail(storageService, "buckets") ?? "--" },
                { label: "Response", value: storageService ? formatDuration(storageService.responseTimeMs) : "--" },
                { label: "Uptime", value: storageService ? uptimeMsToHours(storageService.uptime) : "--" },
              ]}
            />
          </Col>
          <Col xs={24} lg={12} xl={8}>
            <ServiceCard
              title="AI (Ollama)"
              status={aiService?.status ?? "unknown"}
              icon={<RobotOutlined style={{ color: COLORS.gold }} />}
              metrics={[
                { label: "Response", value: aiService ? formatDuration(aiService.responseTimeMs) : "--" },
                { label: "Error Rate", value: aiService ? formatPercent(aiService.errorRate) : "--" },
                { label: "Uptime", value: aiService ? uptimeMsToHours(aiService.uptime) : "--" },
              ]}
            />
          </Col>
        </Row>

        {/* Time series placeholder — Grafana dashboards above provide real-time metrics */}
        <Row gutter={[16, 16]}>
          <Col xs={24}>
            <Card
              style={{ background: "#1A1528", border: "1px solid #2D2640", textAlign: "center" }}
              styles={{ body: { padding: 32 } }}
            >
              <Space direction="vertical" size={8}>
                <InfoCircleOutlined style={{ fontSize: 28, color: COLORS.violet }} />
                <Typography.Text style={{ color: "#9CA3AF" }}>
                  Connect Grafana for real-time time-series metrics (RPS, latency, queue depth).
                </Typography.Text>
                <Typography.Text type="secondary" style={{ fontSize: 12 }}>
                  Grafana panels are embedded above when available. Configure VITE_GRAFANA_URL in your environment.
                </Typography.Text>
              </Space>
            </Card>
          </Col>
        </Row>

        {/* Alert History Timeline */}
        <Card
          title={
            <Space>
              <WarningOutlined style={{ color: COLORS.warning }} />
              <span style={{ color: COLORS.white }}>Alert History</span>
            </Space>
          }
          style={{ background: "#1A1528", border: "1px solid #2D2640" }}
          styles={{ header: { borderBottom: "1px solid #2D2640" } }}
        >
          {alerts.length === 0 ? (
            <Typography.Text style={{ color: "#9CA3AF" }}>
              All services are healthy. No active alerts.
            </Typography.Text>
          ) : (
            <Timeline
              items={alerts.map((alert) => ({
                color: severityColor[alert.severity] ?? COLORS.unknown,
                children: (
                  <div key={alert.id}>
                    <Space>
                      <Tag color={getStatusColor(alert.severity)}>{alert.severity.toUpperCase()}</Tag>
                      <Typography.Text strong style={{ color: COLORS.white }}>
                        {alert.service}
                      </Typography.Text>
                      {alert.resolved && <Tag color="success">Resolved</Tag>}
                    </Space>
                    <div>
                      <Typography.Text style={{ color: "#D1D5DB" }}>
                        {alert.message}
                      </Typography.Text>
                    </div>
                    <Typography.Text type="secondary" style={{ fontSize: 12 }}>
                      {formatRelativeTime(alert.timestamp)}
                    </Typography.Text>
                  </div>
                ),
              }))}
            />
          )}
        </Card>
      </Space>
    </Spin>
  );
};
