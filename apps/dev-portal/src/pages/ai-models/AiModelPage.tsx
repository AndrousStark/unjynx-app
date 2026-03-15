// ============================================================
// R6 - AI Model Management Page
// ============================================================

import { useState, useMemo, useCallback } from "react";
import {
  Typography,
  Space,
  Row,
  Col,
  Card,
  Table,
  Tag,
  Button,
  Tabs,
  InputNumber,
  Slider,
  Modal,
  Descriptions,
  Spin,
  Alert,
  message,
} from "antd";
import {
  RobotOutlined,
  ExperimentOutlined,
  DollarOutlined,
  HistoryOutlined,
  RollbackOutlined,
  PlayCircleOutlined,
  PauseCircleOutlined,
  InfoCircleOutlined,
} from "@ant-design/icons";
import { useCustom } from "@refinedev/core";
import { MetricPanel } from "@/components/charts/MetricPanel";
import { TimeSeriesChart } from "@/components/charts/TimeSeriesChart";
import { CodeBlock } from "@/components/common/CodeBlock";
import type { PromptVersion, AbTestConfig } from "@/types";
import { COLORS, REFRESH_INTERVALS } from "@/utils/constants";
import { fetchWithAuth, apiUrl } from "@/providers/data-provider";
import {
  formatTimestamp,
  formatNumber,
  formatCurrency,
  formatPercent,
  formatDuration,
  getStatusColor,
} from "@/utils/formatters";

// --- Types for API responses ---

interface ModelApiItem {
  readonly key: string;
  readonly modelId: string;
  readonly provider: string;
  readonly maxTokens: number;
  readonly temperature: number;
  readonly isActive: boolean;
}

interface UsageApiItem {
  readonly modelKey: string;
  readonly totalRequests: number;
  readonly totalTokens: number;
  readonly avgResponseMs: number;
  readonly errorRate: number;
  readonly costUsd: number;
}

// --- Mapped internal types ---

interface ModelConfigRow {
  readonly id: string;
  readonly key: string;
  readonly provider: string;
  readonly modelId: string;
  readonly maxTokens: number;
  readonly temperature: number;
  readonly status: "active" | "inactive";
}

interface CostRow {
  readonly modelId: string;
  readonly modelKey: string;
  readonly provider: string;
  readonly tokensUsed: number;
  readonly totalCost: number;
  readonly avgCostPerRequest: number;
}

interface QualityRow {
  readonly modelId: string;
  readonly modelKey: string;
  readonly successRate: number;
  readonly avgResponseTime: number;
  readonly errorRate: number;
  readonly totalRequests: number;
}

// --- Mock data for sections without backend endpoints ---

const mockPromptVersions: PromptVersion[] = [
  { id: "p1", promptName: "task_scheduler", version: 5, content: "You are UNJYNX's AI scheduling assistant. Analyze the user's task list and suggest optimal scheduling based on:\n1. Priority (p0-p3)\n2. Due date proximity\n3. Energy levels (from user's historical patterns)\n4. Time blocking preferences\n\nRespond in JSON format with scheduled_times array.", createdAt: "2026-03-10T10:00:00Z", createdBy: "developer", status: "active" },
  { id: "p2", promptName: "task_scheduler", version: 4, content: "You are a scheduling assistant for UNJYNX app. Given a list of tasks, suggest optimal times...", createdAt: "2026-03-08T14:00:00Z", createdBy: "developer", status: "archived" },
  { id: "p3", promptName: "task_scheduler", version: 3, content: "Schedule the following tasks based on priority and due date...", createdAt: "2026-03-05T10:00:00Z", createdBy: "developer", status: "archived" },
  { id: "p4", promptName: "daily_insight", version: 2, content: "Analyze the user's productivity data for the past week and generate a brief insight (max 3 sentences) about their patterns. Include one actionable suggestion.", createdAt: "2026-03-09T10:00:00Z", createdBy: "developer", status: "active" },
  { id: "p5", promptName: "content_categorizer", version: 1, content: "Categorize the following content item into one of the 60+ UNJYNX categories. Return the category name and confidence score.", createdAt: "2026-03-07T10:00:00Z", createdBy: "developer", status: "active" },
];

const mockAbTests: AbTestConfig[] = [
  { id: "ab1", name: "Scheduler Prompt v4 vs v5", promptA: "task_scheduler v4", promptB: "task_scheduler v5", trafficSplit: 50, status: "running", winner: null, startDate: "2026-03-09T10:00:00Z" },
  { id: "ab2", name: "Insight Tone: Professional vs Friendly", promptA: "daily_insight_formal", promptB: "daily_insight_friendly", trafficSplit: 50, status: "completed", winner: "B", startDate: "2026-03-01T10:00:00Z" },
];

// --- Helpers ---

const formatProviderDisplay = (provider: string): string => {
  switch (provider) {
    case "anthropic":
      return "Anthropic";
    case "ollama":
      return "Ollama (Local)";
    default:
      return provider;
  }
};

const updateModelConfig = async (key: string, config: object): Promise<{ updated: boolean }> => {
  const res = await fetchWithAuth(`${apiUrl}/ai-models/${key}`, {
    method: "PATCH",
    body: JSON.stringify(config),
  });
  if (!res.ok) throw new Error(`PATCH failed: ${res.status}`);
  const json = await res.json();
  return json.data ?? json;
};

export const AiModelPage: React.FC = () => {
  const [selectedPrompt, setSelectedPrompt] = useState<PromptVersion | null>(null);

  // --- API calls ---

  const {
    data: modelsData,
    isLoading: modelsLoading,
    isError: modelsError,
    refetch: refetchModels,
  } = useCustom<ModelApiItem[]>({
    url: "ai-models",
    method: "get",
    queryOptions: {
      refetchInterval: REFRESH_INTERVALS.normal,
      queryKey: ["ai-models"],
    },
  });

  const {
    data: usageData,
    isLoading: usageLoading,
    isError: usageError,
  } = useCustom<UsageApiItem[]>({
    url: "ai-usage",
    method: "get",
    queryOptions: {
      refetchInterval: REFRESH_INTERVALS.normal,
      queryKey: ["ai-usage"],
    },
  });

  // --- Derived data ---

  const modelItems: readonly ModelApiItem[] = useMemo(
    () => (modelsData?.data as unknown as ModelApiItem[]) ?? [],
    [modelsData],
  );

  const usageItems: readonly UsageApiItem[] = useMemo(
    () => (usageData?.data as unknown as UsageApiItem[]) ?? [],
    [usageData],
  );

  // Map models for Model Configuration tab
  const modelConfigRows: readonly ModelConfigRow[] = useMemo(
    () =>
      modelItems.map((m) => ({
        id: m.key,
        key: m.key,
        provider: formatProviderDisplay(m.provider),
        modelId: m.modelId,
        maxTokens: m.maxTokens,
        temperature: m.temperature,
        status: m.isActive ? ("active" as const) : ("inactive" as const),
      })),
    [modelItems],
  );

  // Map usage for Cost Tracking tab
  const costRows: readonly CostRow[] = useMemo(
    () =>
      usageItems.map((u) => {
        const model = modelItems.find((m) => m.key === u.modelKey);
        return {
          modelId: model?.modelId ?? u.modelKey,
          modelKey: u.modelKey,
          provider: model ? formatProviderDisplay(model.provider) : u.modelKey,
          tokensUsed: u.totalTokens,
          totalCost: u.costUsd,
          avgCostPerRequest:
            u.totalRequests > 0 ? u.costUsd / u.totalRequests : 0,
        };
      }),
    [usageItems, modelItems],
  );

  // Map usage for Quality tab
  const qualityRows: readonly QualityRow[] = useMemo(
    () =>
      usageItems.map((u) => {
        const model = modelItems.find((m) => m.key === u.modelKey);
        return {
          modelId: model?.modelId ?? u.modelKey,
          modelKey: u.modelKey,
          successRate: 100 - u.errorRate,
          avgResponseTime: u.avgResponseMs,
          errorRate: u.errorRate,
          totalRequests: u.totalRequests,
        };
      }),
    [usageItems, modelItems],
  );

  // Overview metrics
  const totalDailyCost = useMemo(
    () => costRows.reduce((s, c) => s + c.totalCost, 0),
    [costRows],
  );

  const totalRequests = useMemo(
    () => qualityRows.reduce((s, q) => s + q.totalRequests, 0),
    [qualityRows],
  );

  const activeModelCount = useMemo(
    () => modelConfigRows.filter((m) => m.status === "active").length,
    [modelConfigRows],
  );

  // Cost history placeholder from current data
  const costChartData = useMemo(() => {
    if (costRows.length === 0) return [];
    // Build a single-point chart from current cost data per model
    return [
      costRows.reduce(
        (acc, row) => {
          const shortName = row.modelId.replace("claude-", "").replace(/[.:]/g, "_");
          return { ...acc, [shortName]: row.totalCost };
        },
        { time: "Today" } as Record<string, unknown>,
      ),
    ];
  }, [costRows]);

  const costChartSeries = useMemo(
    () =>
      costRows
        .filter((r) => r.totalCost > 0)
        .map((row, i) => {
          const colors = [COLORS.chartTertiary, COLORS.chartPrimary, COLORS.chartSecondary, COLORS.chartQuaternary];
          return {
            dataKey: row.modelId.replace("claude-", "").replace(/[.:]/g, "_"),
            name: row.modelId,
            color: colors[i % colors.length],
          };
        }),
    [costRows],
  );

  // Temperature change handler
  const handleTemperatureChange = useCallback(
    async (modelKey: string, modelId: string, newTemp: number) => {
      try {
        await updateModelConfig(modelKey, { temperature: newTemp });
        message.success(`Temperature updated to ${newTemp} for ${modelId}`);
        refetchModels();
      } catch {
        message.error(`Failed to update temperature for ${modelId}`);
      }
    },
    [refetchModels],
  );

  const isLoading = modelsLoading || usageLoading;

  const tabItems = [
    {
      key: "models",
      label: (
        <span>
          <RobotOutlined /> Model Configuration
        </span>
      ),
      children: (
        <Space direction="vertical" size={16} style={{ width: "100%" }}>
          {modelsError && (
            <Alert
              message="Failed to load model configuration"
              description="Could not fetch AI models from the backend."
              type="error"
              showIcon
              closable
            />
          )}
          <Table
            dataSource={modelConfigRows as unknown as ModelConfigRow[]}
            rowKey="id"
            pagination={false}
            loading={modelsLoading}
            columns={[
              {
                title: "Provider",
                dataIndex: "provider",
                render: (v: string) => (
                  <Tag color={v.includes("Anthropic") ? "purple" : "blue"}>{v}</Tag>
                ),
                width: 130,
              },
              {
                title: "Model ID",
                dataIndex: "modelId",
                render: (v: string) => (
                  <Typography.Text code style={{ fontSize: 12 }}>
                    {v}
                  </Typography.Text>
                ),
              },
              {
                title: "Max Tokens",
                dataIndex: "maxTokens",
                render: (v: number) => formatNumber(v),
                width: 100,
              },
              {
                title: "Temperature",
                dataIndex: "temperature",
                render: (v: number, record: ModelConfigRow) => (
                  <Slider
                    defaultValue={v}
                    min={0}
                    max={1}
                    step={0.1}
                    style={{ width: 100 }}
                    tooltip={{ formatter: (val) => `${val}` }}
                    onChangeComplete={(newVal: number) =>
                      handleTemperatureChange(record.key, record.modelId, newVal)
                    }
                  />
                ),
                width: 140,
              },
              {
                title: "Key",
                dataIndex: "key",
                render: (v: string) => (
                  <Typography.Text style={{ color: "#9CA3AF", fontSize: 11 }}>
                    {v}
                  </Typography.Text>
                ),
                width: 120,
              },
              {
                title: "Status",
                dataIndex: "status",
                render: (v: string) => (
                  <Tag color={getStatusColor(v)}>{v}</Tag>
                ),
                width: 90,
              },
            ]}
          />
        </Space>
      ),
    },
    {
      key: "prompts",
      label: (
        <span>
          <HistoryOutlined /> Prompt Versioning
        </span>
      ),
      children: (
        <Space direction="vertical" size={16} style={{ width: "100%" }}>
          <Alert
            message="Prompt versioning (local preview)"
            type="info"
            showIcon
            icon={<InfoCircleOutlined />}
            style={{ marginBottom: 0 }}
          />
          <Table
            dataSource={mockPromptVersions}
            rowKey="id"
            pagination={false}
            onRow={(record) => ({
              onClick: () => setSelectedPrompt(record as unknown as PromptVersion),
              style: { cursor: "pointer" },
            })}
            columns={[
              {
                title: "Prompt",
                dataIndex: "promptName",
                render: (v: string) => (
                  <Typography.Text code>{v}</Typography.Text>
                ),
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
                title: "Created",
                dataIndex: "createdAt",
                render: (v: string) => formatTimestamp(v),
                width: 180,
              },
              {
                title: "By",
                dataIndex: "createdBy",
                width: 100,
              },
              {
                title: "Actions",
                key: "actions",
                width: 120,
                render: (_: unknown, record: PromptVersion) =>
                  record.status === "archived" ? (
                    <Button
                      size="small"
                      icon={<RollbackOutlined />}
                      onClick={(e) => {
                        e.stopPropagation();
                        message.success(`Rolled back to ${record.promptName} v${record.version}`);
                      }}
                    >
                      Rollback
                    </Button>
                  ) : null,
              },
            ]}
          />
          <Modal
            title={
              selectedPrompt
                ? `${selectedPrompt.promptName} v${selectedPrompt.version}`
                : ""
            }
            open={!!selectedPrompt}
            onCancel={() => setSelectedPrompt(null)}
            footer={null}
            width={700}
          >
            {selectedPrompt && (
              <Space direction="vertical" size={12} style={{ width: "100%" }}>
                <Descriptions size="small">
                  <Descriptions.Item label="Status">
                    <Tag color={getStatusColor(selectedPrompt.status)}>
                      {selectedPrompt.status}
                    </Tag>
                  </Descriptions.Item>
                  <Descriptions.Item label="Created">
                    {formatTimestamp(selectedPrompt.createdAt)}
                  </Descriptions.Item>
                  <Descriptions.Item label="Author">
                    {selectedPrompt.createdBy}
                  </Descriptions.Item>
                </Descriptions>
                <CodeBlock
                  code={selectedPrompt.content}
                  language="text"
                  showLineNumbers
                  maxHeight={400}
                />
              </Space>
            )}
          </Modal>
        </Space>
      ),
    },
    {
      key: "costs",
      label: (
        <span>
          <DollarOutlined /> Cost Tracking
        </span>
      ),
      children: (
        <Space direction="vertical" size={16} style={{ width: "100%" }}>
          {usageError && (
            <Alert
              message="Failed to load usage data"
              description="Cost information is unavailable. Check backend connectivity."
              type="error"
              showIcon
              closable
            />
          )}
          <Row gutter={[16, 16]}>
            <Col xs={12} sm={6}>
              <MetricPanel
                title="Daily Cost"
                value={formatCurrency(totalDailyCost)}
              />
            </Col>
            <Col xs={12} sm={6}>
              <MetricPanel
                title="Est. Monthly"
                value={formatCurrency(totalDailyCost * 30)}
              />
            </Col>
            <Col xs={12} sm={6}>
              <MetricPanel
                title="Total Tokens"
                value={`${(costRows.reduce((s, c) => s + c.tokensUsed, 0) / 1_000_000).toFixed(1)}M`}
              />
            </Col>
            <Col xs={12} sm={6}>
              <MetricPanel
                title="Avg Cost/Request"
                value={totalRequests > 0 ? formatCurrency(totalDailyCost / totalRequests) : "$0.00"}
              />
            </Col>
          </Row>

          <TimeSeriesChart
            title="Cost per Model (current snapshot)"
            data={costChartData as unknown as Record<string, unknown>[]}
            series={costChartSeries}
            yAxisLabel="$ USD"
            height={250}
          />

          <Table
            dataSource={costRows as unknown as CostRow[]}
            rowKey="modelKey"
            pagination={false}
            loading={usageLoading}
            columns={[
              {
                title: "Model",
                dataIndex: "modelId",
                render: (v: string) => (
                  <Typography.Text code>{v}</Typography.Text>
                ),
              },
              {
                title: "Provider",
                dataIndex: "provider",
                render: (v: string) => <Tag>{v}</Tag>,
                width: 100,
              },
              {
                title: "Tokens Used",
                dataIndex: "tokensUsed",
                render: (v: number) => formatNumber(v),
                width: 120,
              },
              {
                title: "Total Cost",
                dataIndex: "totalCost",
                render: (v: number) => (
                  <Typography.Text strong>
                    {v === 0 ? <Tag color="success">FREE</Tag> : formatCurrency(v)}
                  </Typography.Text>
                ),
                width: 100,
              },
              {
                title: "Cost/Request",
                dataIndex: "avgCostPerRequest",
                render: (v: number) =>
                  v === 0 ? "-" : formatCurrency(v),
                width: 120,
              },
            ]}
          />
        </Space>
      ),
    },
    {
      key: "quality",
      label: (
        <span>
          <ExperimentOutlined /> Quality & A/B Tests
        </span>
      ),
      children: (
        <Space direction="vertical" size={16} style={{ width: "100%" }}>
          <Typography.Title level={5} style={{ color: COLORS.white }}>
            Quality Metrics
          </Typography.Title>
          {usageError && (
            <Alert
              message="Failed to load quality metrics"
              description="Quality data is unavailable."
              type="error"
              showIcon
              closable
            />
          )}
          <Table
            dataSource={qualityRows as unknown as QualityRow[]}
            rowKey="modelKey"
            pagination={false}
            loading={usageLoading}
            columns={[
              {
                title: "Model",
                dataIndex: "modelId",
                render: (v: string) => (
                  <Typography.Text code>{v}</Typography.Text>
                ),
              },
              {
                title: "Success Rate",
                dataIndex: "successRate",
                render: (v: number) => (
                  <Tag color={v > 98 ? "success" : v > 95 ? "warning" : "error"}>
                    {formatPercent(v)}
                  </Tag>
                ),
                width: 120,
              },
              {
                title: "Avg Response Time",
                dataIndex: "avgResponseTime",
                render: (v: number) => formatDuration(v),
                width: 140,
              },
              {
                title: "Error Rate",
                dataIndex: "errorRate",
                render: (v: number) => (
                  <Tag color={v < 1 ? "success" : v < 3 ? "warning" : "error"}>
                    {formatPercent(v)}
                  </Tag>
                ),
                width: 100,
              },
              {
                title: "Total Requests",
                dataIndex: "totalRequests",
                render: (v: number) => formatNumber(v),
                width: 120,
              },
            ]}
          />

          <Typography.Title level={5} style={{ color: COLORS.white, marginTop: 16 }}>
            A/B Tests
            <Tag color="default" style={{ marginLeft: 8, fontWeight: "normal" }}>A/B testing (preview)</Tag>
          </Typography.Title>
          <Table
            dataSource={mockAbTests}
            rowKey="id"
            pagination={false}
            columns={[
              { title: "Test Name", dataIndex: "name" },
              {
                title: "Variant A",
                dataIndex: "promptA",
                render: (v: string) => <Tag>{v}</Tag>,
              },
              {
                title: "Variant B",
                dataIndex: "promptB",
                render: (v: string) => <Tag>{v}</Tag>,
              },
              {
                title: "Split",
                dataIndex: "trafficSplit",
                render: (v: number) => (
                  <InputNumber
                    value={v}
                    min={0}
                    max={100}
                    size="small"
                    suffix="%"
                    style={{ width: 80 }}
                    onChange={() => message.info("Traffic split updated")}
                  />
                ),
                width: 110,
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
                title: "Winner",
                dataIndex: "winner",
                render: (v: string | null) =>
                  v ? <Tag color="gold">Variant {v}</Tag> : "-",
                width: 100,
              },
              {
                title: "Started",
                dataIndex: "startDate",
                render: (v: string) => formatTimestamp(v),
                width: 160,
              },
              {
                title: "Actions",
                key: "actions",
                width: 100,
                render: (_: unknown, record: AbTestConfig) =>
                  record.status === "running" ? (
                    <Button
                      size="small"
                      icon={<PauseCircleOutlined />}
                      onClick={() => message.info("A/B test paused")}
                    >
                      Pause
                    </Button>
                  ) : record.status === "paused" ? (
                    <Button
                      size="small"
                      icon={<PlayCircleOutlined />}
                      onClick={() => message.info("A/B test resumed")}
                    >
                      Resume
                    </Button>
                  ) : null,
              },
            ]}
          />
        </Space>
      ),
    },
  ];

  return (
    <Spin spinning={isLoading} size="large">
      <Space direction="vertical" size={24} style={{ width: "100%" }}>
        <Typography.Title level={3} style={{ margin: 0, color: COLORS.white }}>
          AI Model Management
        </Typography.Title>

        <Row gutter={[16, 16]}>
          <Col xs={12} sm={6}>
            <MetricPanel title="Active Models" value={activeModelCount} />
          </Col>
          <Col xs={12} sm={6}>
            <MetricPanel title="Total Requests" value={formatNumber(totalRequests)} />
          </Col>
          <Col xs={12} sm={6}>
            <MetricPanel title="Daily Cost" value={formatCurrency(totalDailyCost)} />
          </Col>
          <Col xs={12} sm={6}>
            <MetricPanel title="Prompt Versions" value={mockPromptVersions.length} />
          </Col>
        </Row>

        {/* API error alerts at the top level */}
        {modelsError && (
          <Alert
            message="Failed to load AI models"
            description="Model data is unavailable. Tabs may show empty tables."
            type="error"
            showIcon
            closable
          />
        )}
        {usageError && (
          <Alert
            message="Failed to load AI usage data"
            description="Cost and quality data are unavailable."
            type="error"
            showIcon
            closable
          />
        )}

        <Card
          style={{ background: "#1A1528", border: "1px solid #2D2640" }}
          styles={{ body: { padding: 0 } }}
        >
          <Tabs
            defaultActiveKey="models"
            items={tabItems}
            tabBarStyle={{
              padding: "0 16px",
              borderBottom: "1px solid #2D2640",
            }}
            style={{ padding: "0 16px 16px" }}
          />
        </Card>
      </Space>
    </Spin>
  );
};
