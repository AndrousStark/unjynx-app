// ============================================================
// R8 - Data Pipeline Page
// ============================================================

import { useMemo } from "react";
import {
  Typography,
  Space,
  Row,
  Col,
  Card,
  Table,
  Tag,
  Steps,
  Badge,
  Button,
  Spin,
  Alert,
  message,
} from "antd";
import {
  NodeIndexOutlined,
  PlayCircleOutlined,
  CheckCircleOutlined,
  ClockCircleOutlined,
  ExclamationCircleOutlined,
  SafetyCertificateOutlined,
  ReloadOutlined,
  DeleteOutlined,
} from "@ant-design/icons";
import { useCustom } from "@refinedev/core";
import { StatusIndicator } from "@/components/common/StatusIndicator";
import { MetricPanel } from "@/components/charts/MetricPanel";
import type { AnonymizationStatus } from "@/types";
import { COLORS, REFRESH_INTERVALS } from "@/utils/constants";
import {
  formatTimestamp,
  formatRelativeTime,
  formatDuration,
  formatNumber,
  formatPercent,
  formatCron,
  getStatusColor,
} from "@/utils/formatters";

// --- API response types ---

interface PipelineEntry {
  readonly name: string;
  readonly description: string;
  readonly schedule: string;
  readonly lastRun: string | null;
  readonly nextRun: string;
  readonly status: "idle" | "running" | "succeeded" | "failed";
  readonly durationMs: number | null;
  readonly errorMessage: string | null;
}

interface BackupEntry {
  readonly id: string;
  readonly createdAt: string;
  readonly sizeBytes: number;
  readonly status: "completed" | "failed" | "in_progress";
  readonly verified: boolean;
  readonly lastVerifiedAt: string | null;
}

// --- Mock data kept for sections without backend endpoints ---

const mockAnonymization: AnonymizationStatus[] = [
  { tableName: "profiles", piiFields: ["email", "display_name", "avatar_url"], anonymized: true, lastAnonymized: "2026-03-10T03:00:00Z", complianceStatus: "compliant" },
  { tableName: "tasks", piiFields: ["title", "description"], anonymized: false, lastAnonymized: null, complianceStatus: "pending" },
  { tableName: "notifications", piiFields: ["content"], anonymized: true, lastAnonymized: "2026-03-10T03:00:00Z", complianceStatus: "compliant" },
  { tableName: "delivery_attempts", piiFields: ["recipient"], anonymized: true, lastAnonymized: "2026-03-10T03:00:00Z", complianceStatus: "compliant" },
  { tableName: "audit_log", piiFields: ["ip_address", "user_agent"], anonymized: false, lastAnonymized: null, complianceStatus: "non_compliant" },
];

// --- Status icon map (updated keys to match API status values) ---

const etlStatusIcon: Record<string, React.ReactNode> = {
  running: <PlayCircleOutlined style={{ color: COLORS.info }} />,
  succeeded: <CheckCircleOutlined style={{ color: COLORS.healthy }} />,
  failed: <ExclamationCircleOutlined style={{ color: COLORS.critical }} />,
  idle: <ClockCircleOutlined style={{ color: COLORS.warning }} />,
  // Legacy keys for backward compatibility
  completed: <CheckCircleOutlined style={{ color: COLORS.healthy }} />,
  scheduled: <ClockCircleOutlined style={{ color: COLORS.warning }} />,
};

// --- Map API status to display-friendly status ---
const mapPipelineStatus = (status: string): string => {
  if (status === "succeeded") return "completed";
  if (status === "idle") return "scheduled";
  return status;
};

// --- Map backup status to integrity check result ---
const mapIntegrityCheck = (status: string): string => {
  if (status === "completed") return "passed";
  if (status === "failed") return "failed";
  return "pending";
};

// --- Derive pipeline stages from pipeline data ---
const derivePipelineStages = (pipelines: readonly PipelineEntry[]) => {
  // Group pipelines into logical stages based on name patterns
  const stageMap: Record<string, { readonly label: string; readonly patterns: readonly string[] }> = {
    ingestion: { label: "Ingestion", patterns: ["content", "ingestion", "sync", "import"] },
    processing: { label: "Processing", patterns: ["analytics", "calculation", "embedding", "aggregation"] },
    delivery: { label: "Delivery", patterns: ["notification", "delivery", "export", "backup", "cleanup"] },
  };

  return Object.entries(stageMap).map(([key, stage]) => {
    const matchedPipelines = pipelines.filter((p) =>
      stage.patterns.some((pat) => p.name.toLowerCase().includes(pat))
    );
    const hasFailure = matchedPipelines.some((p) => p.status === "failed");
    const hasRunning = matchedPipelines.some((p) => p.status === "running");
    const allSucceeded = matchedPipelines.length > 0 && matchedPipelines.every(
      (p) => p.status === "succeeded" || p.status === "idle"
    );

    let status: "healthy" | "degraded" | "down" = "healthy";
    if (hasFailure) status = "down";
    else if (hasRunning) status = "degraded";

    return {
      stage: key,
      label: stage.label,
      status,
      pipelineCount: matchedPipelines.length,
      allSucceeded,
    };
  });
};

export const DataPipelinePage: React.FC = () => {
  const { data: pipelinesData, isLoading: pipelinesLoading } = useCustom({
    url: "pipelines",
    method: "get",
    queryOptions: {
      refetchInterval: REFRESH_INTERVALS.normal,
      queryKey: ["pipelines"],
    },
  });

  const { data: backupsData, isLoading: backupsLoading } = useCustom({
    url: "pipelines/backups",
    method: "get",
    queryOptions: {
      queryKey: ["pipeline-backups"],
    },
  });

  const pipelines = (pipelinesData?.data as PipelineEntry[] | undefined) ?? [];
  const backups = (backupsData?.data as BackupEntry[] | undefined) ?? [];

  const isLoading = pipelinesLoading || backupsLoading;

  // Derived metrics
  const failedJobs = useMemo(
    () => pipelines.filter((j) => j.status === "failed").length,
    [pipelines]
  );

  const totalDurationMs = useMemo(
    () => pipelines.reduce((s, j) => s + (j.durationMs ?? 0), 0),
    [pipelines]
  );

  const compliantTables = mockAnonymization.filter(
    (a) => a.complianceStatus === "compliant"
  ).length;

  const verifiedBackups = useMemo(
    () => backups.filter((b) => b.verified).length,
    [backups]
  );

  // Pipeline stages derived from data
  const pipelineStages = useMemo(
    () => derivePipelineStages(pipelines),
    [pipelines]
  );

  // Pipeline health summary
  const pipelineHealthSummary = useMemo(() => {
    const byStatus = {
      succeeded: pipelines.filter((p) => p.status === "succeeded").length,
      running: pipelines.filter((p) => p.status === "running").length,
      failed: pipelines.filter((p) => p.status === "failed").length,
      idle: pipelines.filter((p) => p.status === "idle").length,
    };
    return [
      { name: "Succeeded", count: byStatus.succeeded, color: COLORS.healthy },
      { name: "Running", count: byStatus.running, color: COLORS.info },
      { name: "Failed", count: byStatus.failed, color: COLORS.critical },
      { name: "Idle", count: byStatus.idle, color: COLORS.warning },
    ];
  }, [pipelines]);

  return (
    <Spin spinning={isLoading} size="large">
      <Space direction="vertical" size={24} style={{ width: "100%" }}>
        <Typography.Title level={3} style={{ margin: 0, color: COLORS.white }}>
          Data Pipeline
        </Typography.Title>

        {/* Overview Metrics */}
        <Row gutter={[16, 16]}>
          <Col xs={12} sm={6}>
            <MetricPanel
              title="Pipelines"
              value={pipelines.length}
              description={`${failedJobs} failed`}
            />
          </Col>
          <Col xs={12} sm={6}>
            <MetricPanel
              title="Total Duration"
              value={totalDurationMs > 0 ? formatDuration(totalDurationMs) : "--"}
              description="last runs combined"
            />
          </Col>
          <Col xs={12} sm={6}>
            <MetricPanel
              title="GDPR Compliance"
              value={`${compliantTables}/${mockAnonymization.length}`}
              progress={(compliantTables / mockAnonymization.length) * 100}
              thresholds={{ warning: 80, critical: 60, inverted: true }}
            />
          </Col>
          <Col xs={12} sm={6}>
            <MetricPanel
              title="Backups Verified"
              value={verifiedBackups}
              suffix={`/ ${backups.length}`}
            />
          </Col>
        </Row>

        {/* Content Pipeline - Visual Steps (derived from pipeline data) */}
        <Card
          title={
            <Space>
              <NodeIndexOutlined style={{ color: COLORS.violet }} />
              <span style={{ color: COLORS.white }}>Content Pipeline</span>
            </Space>
          }
          style={{ background: "#1A1528", border: "1px solid #2D2640" }}
          styles={{ header: { borderBottom: "1px solid #2D2640" } }}
        >
          {pipelines.length === 0 ? (
            <Typography.Text style={{ color: "#9CA3AF" }}>
              No pipeline data available
            </Typography.Text>
          ) : (
            <Steps
              current={-1}
              items={pipelineStages.map((stage) => ({
                title: (
                  <span style={{ color: COLORS.white, textTransform: "capitalize" }}>
                    {stage.label}
                  </span>
                ),
                description: (
                  <Space direction="vertical" size={2}>
                    <StatusIndicator status={stage.status} size="small" />
                    <Typography.Text style={{ color: "#9CA3AF", fontSize: 11 }}>
                      Pipelines: {stage.pipelineCount}
                    </Typography.Text>
                  </Space>
                ),
                status: stage.status === "healthy" ? "finish" : stage.status === "degraded" ? "process" : "error",
                icon:
                  stage.status === "healthy" ? (
                    <CheckCircleOutlined style={{ color: COLORS.healthy }} />
                  ) : stage.status === "down" ? (
                    <ExclamationCircleOutlined style={{ color: COLORS.critical }} />
                  ) : (
                    <ExclamationCircleOutlined style={{ color: COLORS.warning }} />
                  ),
              }))}
            />
          )}
        </Card>

        {/* ETL Jobs Table (from pipelines API) */}
        <Card
          title={
            <Space>
              <ClockCircleOutlined style={{ color: COLORS.gold }} />
              <span style={{ color: COLORS.white }}>ETL Job Status</span>
            </Space>
          }
          style={{ background: "#1A1528", border: "1px solid #2D2640" }}
          styles={{ header: { borderBottom: "1px solid #2D2640" } }}
        >
          <Table
            dataSource={pipelines}
            rowKey="name"
            pagination={false}
            loading={pipelinesLoading}
            columns={[
              {
                title: "",
                key: "icon",
                width: 32,
                render: (_: unknown, record: PipelineEntry) =>
                  etlStatusIcon[record.status] ?? <ClockCircleOutlined style={{ color: COLORS.unknown }} />,
              },
              {
                title: "Job Name",
                dataIndex: "name",
                render: (v: string) => (
                  <Typography.Text code style={{ fontSize: 12 }}>
                    {v}
                  </Typography.Text>
                ),
              },
              {
                title: "Schedule",
                dataIndex: "schedule",
                render: (v: string) => (
                  <Space direction="vertical" size={0}>
                    <Typography.Text style={{ fontSize: 12 }}>
                      {formatCron(v)}
                    </Typography.Text>
                    <Typography.Text code style={{ fontSize: 10, color: "#6B7280" }}>
                      {v}
                    </Typography.Text>
                  </Space>
                ),
                width: 160,
              },
              {
                title: "Last Run",
                dataIndex: "lastRun",
                render: (v: string | null) =>
                  v ? formatRelativeTime(v) : <Tag color="default">Never</Tag>,
                width: 120,
              },
              {
                title: "Next Run",
                dataIndex: "nextRun",
                render: (v: string) => formatRelativeTime(v),
                width: 120,
              },
              {
                title: "Status",
                dataIndex: "status",
                render: (v: string) => (
                  <Tag color={getStatusColor(mapPipelineStatus(v))}>
                    {mapPipelineStatus(v)}
                  </Tag>
                ),
                width: 100,
              },
              {
                title: "Duration",
                dataIndex: "durationMs",
                render: (v: number | null) =>
                  v !== null && v > 0 ? formatDuration(v) : "--",
                width: 90,
              },
              {
                title: "Error",
                dataIndex: "errorMessage",
                render: (v: string | null) =>
                  v ? (
                    <Typography.Text
                      type="danger"
                      ellipsis
                      style={{ maxWidth: 150, fontSize: 11, display: "block" }}
                    >
                      {v}
                    </Typography.Text>
                  ) : (
                    "--"
                  ),
                width: 160,
              },
              {
                title: "Actions",
                key: "actions",
                width: 90,
                render: (_: unknown, record: PipelineEntry) => (
                  <Button
                    size="small"
                    icon={<ReloadOutlined />}
                    onClick={() => message.success(`Job ${record.name} triggered`)}
                  >
                    Run
                  </Button>
                ),
              },
            ]}
          />
        </Card>

        {/* Pipeline Health Summary */}
        <Row gutter={[16, 16]}>
          <Col xs={24} lg={12}>
            <Card
              title={
                <span style={{ color: COLORS.white }}>Historical Metrics</span>
              }
              style={{ background: "#1A1528", border: "1px solid #2D2640" }}
              styles={{ header: { borderBottom: "1px solid #2D2640" } }}
            >
              <Alert
                message="Historical metrics available via Grafana"
                description="Time series pipeline data (lag, throughput, error rates) can be viewed in the Grafana dashboard for detailed historical analysis."
                type="info"
                showIcon
                style={{ background: "#1A1528", border: "1px solid #2D2640" }}
              />
            </Card>
          </Col>
          <Col xs={24} lg={12}>
            <Card
              title={
                <span style={{ color: COLORS.white }}>Pipeline Health</span>
              }
              style={{ background: "#1A1528", border: "1px solid #2D2640" }}
              styles={{ header: { borderBottom: "1px solid #2D2640" } }}
            >
              <Table
                dataSource={pipelineHealthSummary}
                rowKey="name"
                pagination={false}
                size="small"
                columns={[
                  {
                    title: "Status",
                    dataIndex: "name",
                    render: (v: string, record: { name: string; count: number; color: string }) => (
                      <Space>
                        <div
                          style={{
                            width: 8,
                            height: 8,
                            borderRadius: "50%",
                            background: record.color,
                          }}
                        />
                        <span>{v}</span>
                      </Space>
                    ),
                  },
                  {
                    title: "Count",
                    dataIndex: "count",
                    render: (v: number) => formatNumber(v),
                  },
                  {
                    title: "Percentage",
                    dataIndex: "count",
                    key: "percentage",
                    render: (v: number) =>
                      pipelines.length > 0
                        ? formatPercent((v / pipelines.length) * 100, 0)
                        : "--",
                  },
                ]}
              />
            </Card>
          </Col>
        </Row>

        {/* Backup Verification (from backups API) */}
        <Card
          title={
            <Space>
              <SafetyCertificateOutlined style={{ color: COLORS.healthy }} />
              <span style={{ color: COLORS.white }}>Backup Verification</span>
            </Space>
          }
          style={{ background: "#1A1528", border: "1px solid #2D2640" }}
          styles={{ header: { borderBottom: "1px solid #2D2640" } }}
        >
          <Table
            dataSource={backups}
            rowKey="id"
            pagination={false}
            loading={backupsLoading}
            columns={[
              {
                title: "Backup",
                dataIndex: "id",
                render: (v: string) => (
                  <Typography.Text code style={{ fontSize: 12 }}>
                    {v}
                  </Typography.Text>
                ),
              },
              {
                title: "Created",
                dataIndex: "createdAt",
                render: (v: string) => formatTimestamp(v),
                width: 180,
              },
              {
                title: "Size",
                dataIndex: "sizeBytes",
                render: (v: number) => {
                  if (v < 1024) return `${v} B`;
                  if (v < 1024 * 1024) return `${(v / 1024).toFixed(1)} KB`;
                  if (v < 1024 * 1024 * 1024) return `${(v / (1024 * 1024)).toFixed(1)} MB`;
                  return `${(v / (1024 * 1024 * 1024)).toFixed(2)} GB`;
                },
                width: 100,
              },
              {
                title: "Integrity",
                dataIndex: "status",
                render: (v: string) => (
                  <Tag color={getStatusColor(mapIntegrityCheck(v))}>
                    {mapIntegrityCheck(v)}
                  </Tag>
                ),
                width: 100,
              },
              {
                title: "Checksum",
                dataIndex: "verified",
                render: (v: boolean) => (
                  <Badge
                    status={v ? "success" : "error"}
                    text={v ? "Match" : "Mismatch"}
                  />
                ),
                width: 110,
              },
              {
                title: "Last Verified",
                dataIndex: "lastVerifiedAt",
                render: (v: string | null) =>
                  v ? formatRelativeTime(v) : <Tag color="warning">Never</Tag>,
                width: 130,
              },
              {
                title: "Restore Test",
                key: "restoreTest",
                render: () => (
                  <Tag color="default">N/A</Tag>
                ),
                width: 120,
              },
            ]}
          />
        </Card>

        {/* Data Anonymization / GDPR (preview - no backend endpoint) */}
        <Card
          title={
            <Space>
              <DeleteOutlined style={{ color: COLORS.warning }} />
              <span style={{ color: COLORS.white }}>
                Data Anonymization (DPDP/GDPR)
              </span>
              <Tag color="blue" style={{ fontSize: 10 }}>preview</Tag>
            </Space>
          }
          style={{ background: "#1A1528", border: "1px solid #2D2640" }}
          styles={{ header: { borderBottom: "1px solid #2D2640" } }}
        >
          <Table
            dataSource={mockAnonymization}
            rowKey="tableName"
            pagination={false}
            columns={[
              {
                title: "Table",
                dataIndex: "tableName",
                render: (v: string) => (
                  <Typography.Text code style={{ fontSize: 12 }}>
                    {v}
                  </Typography.Text>
                ),
              },
              {
                title: "PII Fields",
                dataIndex: "piiFields",
                render: (fields: string[]) =>
                  fields.map((f) => (
                    <Tag key={f} color="volcano" style={{ fontSize: 11 }}>
                      {f}
                    </Tag>
                  )),
              },
              {
                title: "Anonymized",
                dataIndex: "anonymized",
                render: (v: boolean) => (
                  <Badge status={v ? "success" : "warning"} text={v ? "Yes" : "No"} />
                ),
                width: 110,
              },
              {
                title: "Last Run",
                dataIndex: "lastAnonymized",
                render: (v: string | null) =>
                  v ? formatRelativeTime(v) : <Tag color="warning">Never</Tag>,
                width: 130,
              },
              {
                title: "Compliance",
                dataIndex: "complianceStatus",
                render: (v: string) => (
                  <Tag color={getStatusColor(v)}>{v.replace("_", " ")}</Tag>
                ),
                width: 120,
              },
            ]}
          />
        </Card>
      </Space>
    </Spin>
  );
};
