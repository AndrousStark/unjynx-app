// ============================================================
// R3 - API Management Page
// ============================================================

import { useState, useCallback } from "react";
import {
  Typography,
  Space,
  Tabs,
  Table,
  Tag,
  Button,
  Card,
  Modal,
  Form,
  Input,
  Select,
  Row,
  Col,
  Popconfirm,
  message,
  InputNumber,
  Spin,
  Alert,
} from "antd";
import {
  ApiOutlined,
  KeyOutlined,
  ThunderboltOutlined,
  GlobalOutlined,
  BarChartOutlined,
  PlusOutlined,
  DeleteOutlined,
  CopyOutlined,
} from "@ant-design/icons";
import { useCustom } from "@refinedev/core";
import { TimeSeriesChart } from "@/components/charts/TimeSeriesChart";
import { MetricPanel } from "@/components/charts/MetricPanel";
import type { ApiKey, RateLimitConfig, WebhookConfig, EndpointUsage } from "@/types";
import { API_BASE_URL, API_PREFIX, COLORS } from "@/utils/constants";
import { userManager } from "@/providers/auth-provider";
import {
  formatTimestamp,
  formatRelativeTime,
  formatNumber,
  formatPercent,
  getStatusColor,
  formatDuration,
} from "@/utils/formatters";

// --- Helper for mutating API calls ---
const apiCall = async (path: string, method: string, body?: unknown) => {
  let headers: Record<string, string> = { "Content-Type": "application/json" };
  try {
    const user = await userManager.getUser();
    if (user?.access_token) {
      headers = { ...headers, Authorization: `Bearer ${user.access_token}` };
    }
  } catch {
    // proceed without auth header
  }
  const res = await fetch(`${API_BASE_URL}${API_PREFIX}/${path}`, {
    method,
    headers,
    body: body ? JSON.stringify(body) : undefined,
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`API Error ${res.status}: ${text || res.statusText}`);
  }
  const json = await res.json();
  return json.data;
};

// --- Expiration mapping ---
const EXPIRY_OPTIONS = [
  { value: "30d", label: "30 days", days: 30 },
  { value: "90d", label: "90 days", days: 90 },
  { value: "1y", label: "1 year", days: 365 },
  { value: "never", label: "Never", days: 3650 },
] as const;

const expiryToDays = (value: string): number => {
  const found = EXPIRY_OPTIONS.find((o) => o.value === value);
  return found?.days ?? 90;
};

// --- Mock data for tabs without backend endpoints ---
const mockRateLimits: RateLimitConfig[] = [
  { endpoint: "/api/v1/tasks", method: "GET", windowMs: 60000, maxRequests: 100, currentUsage: 42 },
  { endpoint: "/api/v1/tasks", method: "POST", windowMs: 60000, maxRequests: 30, currentUsage: 8 },
  { endpoint: "/api/v1/auth/login", method: "POST", windowMs: 900000, maxRequests: 5, currentUsage: 1 },
  { endpoint: "/api/v1/auth/forgot-password", method: "POST", windowMs: 3600000, maxRequests: 3, currentUsage: 0 },
  { endpoint: "/api/v1/notifications/send", method: "POST", windowMs: 60000, maxRequests: 10, currentUsage: 3 },
  { endpoint: "/api/v1/content", method: "GET", windowMs: 60000, maxRequests: 200, currentUsage: 87 },
];

const mockWebhooks: WebhookConfig[] = [
  { id: "w1", url: "https://hooks.slack.com/triggers/unjynx/alerts", events: ["system.alert", "deploy.complete"], status: "active", lastDelivery: "2026-03-11T08:00:00Z", successRate: 99.2 },
  { id: "w2", url: "https://api.telegram.org/bot/webhook/unjynx", events: ["notification.callback"], status: "active", lastDelivery: "2026-03-11T09:15:00Z", successRate: 98.5 },
  { id: "w3", url: "https://partner-api.example.com/events", events: ["user.signup", "subscription.created"], status: "failing", lastDelivery: "2026-03-10T14:00:00Z", successRate: 45.0 },
];

// --- Backend response types ---
interface BackendApiKey {
  readonly id: string;
  readonly name: string;
  readonly keyHash?: string;
  readonly scopes: ReadonlyArray<string>;
  readonly createdAt: string;
  readonly expiresAt: string | null;
  readonly lastUsedAt: string | null;
  readonly isActive: boolean;
}

interface BackendApiUsage {
  readonly endpoint: string;
  readonly method: string;
  readonly totalRequests: number;
  readonly avgResponseMs: number;
  readonly errorCount: number;
  readonly lastCalledAt: string;
}

interface CreateKeyResponse {
  readonly id: string;
  readonly key: string;
  readonly expiresAt: string | null;
}

// --- Map backend responses to frontend types ---
const mapApiKey = (raw: BackendApiKey): ApiKey => ({
  id: raw.id,
  name: raw.name,
  keyPrefix: raw.keyHash ?? "",
  createdAt: raw.createdAt,
  expiresAt: raw.expiresAt,
  lastUsed: raw.lastUsedAt,
  status: raw.isActive ? "active" : "revoked",
  scopes: raw.scopes,
});

const mapApiUsage = (raw: BackendApiUsage): EndpointUsage => ({
  endpoint: raw.endpoint,
  method: raw.method,
  totalRequests: raw.totalRequests,
  avgResponseTime: raw.avgResponseMs,
  errorRate: raw.totalRequests > 0 ? (raw.errorCount / raw.totalRequests) * 100 : 0,
  history: [], // backend does not provide history data
});

export const ApiManagementPage: React.FC = () => {
  const [isCreateKeyModalOpen, setIsCreateKeyModalOpen] = useState(false);
  const [newKeyModalOpen, setNewKeyModalOpen] = useState(false);
  const [newKeyValue, setNewKeyValue] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [form] = Form.useForm();
  const [messageApi, contextHolder] = message.useMessage();

  // --- Fetch API keys from backend ---
  const {
    data: apiKeysResponse,
    isLoading: isLoadingKeys,
    isError: isErrorKeys,
    refetch: refetchKeys,
  } = useCustom<BackendApiKey[]>({
    url: "api-keys",
    method: "get",
    queryOptions: {
      retry: 1,
      queryKey: ["api-keys"],
    },
  });

  const apiKeys: ApiKey[] = (apiKeysResponse?.data ?? []).map(mapApiKey);

  // --- Fetch API usage from backend ---
  const {
    data: apiUsageResponse,
    isLoading: isLoadingUsage,
    isError: isErrorUsage,
  } = useCustom<BackendApiUsage[]>({
    url: "api-usage",
    method: "get",
    queryOptions: {
      retry: 1,
      queryKey: ["api-usage"],
    },
  });

  const endpointUsage: EndpointUsage[] = (apiUsageResponse?.data ?? []).map(mapApiUsage);

  // --- Create API key ---
  const handleCreateKey = useCallback(() => {
    form.validateFields().then(async (values) => {
      setIsSubmitting(true);
      try {
        const result: CreateKeyResponse = await apiCall("api-keys", "POST", {
          name: values.name,
          scopes: values.scopes,
          expiresInDays: expiryToDays(values.expiresIn ?? "90d"),
        });
        setIsCreateKeyModalOpen(false);
        form.resetFields();
        // Show the new key in a modal (only shown once)
        setNewKeyValue(result.key);
        setNewKeyModalOpen(true);
        refetchKeys();
        messageApi.success("API key created successfully");
      } catch (err) {
        messageApi.error(
          `Failed to create API key: ${err instanceof Error ? err.message : "Unknown error"}`
        );
      } finally {
        setIsSubmitting(false);
      }
    });
  }, [form, messageApi, refetchKeys]);

  // --- Revoke (delete) API key ---
  const handleRevokeKey = useCallback(
    async (id: string) => {
      try {
        await apiCall(`api-keys/${id}`, "DELETE");
        refetchKeys();
        messageApi.success("API key revoked");
      } catch (err) {
        messageApi.error(
          `Failed to revoke API key: ${err instanceof Error ? err.message : "Unknown error"}`
        );
      }
    },
    [messageApi, refetchKeys]
  );

  const tabItems = [
    {
      key: "docs",
      label: (
        <span>
          <ApiOutlined /> API Docs
        </span>
      ),
      children: (
        <Card
          style={{ background: "#1A1528", border: "1px solid #2D2640" }}
          styles={{ body: { padding: 0, height: 600 } }}
        >
          <iframe
            src="/api/v1/docs"
            width="100%"
            height="100%"
            frameBorder="0"
            title="API Documentation"
            style={{ border: "none", borderRadius: 8 }}
            sandbox="allow-scripts allow-same-origin"
          />
          <div
            style={{
              position: "absolute",
              top: "50%",
              left: "50%",
              transform: "translate(-50%, -50%)",
              textAlign: "center",
              color: "#6B7280",
            }}
          >
            <ApiOutlined style={{ fontSize: 48, marginBottom: 16 }} />
            <Typography.Text style={{ color: "#6B7280", display: "block" }}>
              OpenAPI/Swagger documentation will be embedded here.
            </Typography.Text>
            <Typography.Text style={{ color: "#9CA3AF", fontSize: 12 }}>
              Configure your backend to serve Swagger UI at /api/v1/docs
            </Typography.Text>
          </div>
        </Card>
      ),
    },
    {
      key: "api-keys",
      label: (
        <span>
          <KeyOutlined /> API Keys
        </span>
      ),
      children: (
        <Space direction="vertical" size={16} style={{ width: "100%" }}>
          {isErrorKeys && (
            <Alert type="error" message="Failed to load API keys" showIcon closable />
          )}
          <div style={{ display: "flex", justifyContent: "flex-end" }}>
            <Button
              type="primary"
              icon={<PlusOutlined />}
              onClick={() => setIsCreateKeyModalOpen(true)}
            >
              Create API Key
            </Button>
          </div>
          <Table
            dataSource={apiKeys}
            rowKey="id"
            pagination={false}
            loading={isLoadingKeys}
            columns={[
              {
                title: "Name",
                dataIndex: "name",
                render: (v: string) => (
                  <Typography.Text strong>{v}</Typography.Text>
                ),
              },
              {
                title: "Key Prefix",
                dataIndex: "keyPrefix",
                render: (v: string) => (
                  <Typography.Text code style={{ fontSize: 12 }}>
                    {v || "------"}
                  </Typography.Text>
                ),
              },
              {
                title: "Scopes",
                dataIndex: "scopes",
                render: (scopes: string[]) =>
                  scopes.map((s) => (
                    <Tag key={s} style={{ fontSize: 11 }}>
                      {s}
                    </Tag>
                  )),
              },
              {
                title: "Created",
                dataIndex: "createdAt",
                render: (v: string) => formatTimestamp(v),
                width: 160,
              },
              {
                title: "Expires",
                dataIndex: "expiresAt",
                render: (v: string | null) =>
                  v ? formatTimestamp(v) : <Tag>Never</Tag>,
                width: 160,
              },
              {
                title: "Last Used",
                dataIndex: "lastUsed",
                render: (v: string | null) =>
                  v ? formatRelativeTime(v) : "-",
                width: 130,
              },
              {
                title: "Status",
                dataIndex: "status",
                render: (v: string) => (
                  <Tag color={getStatusColor(v)}>{v}</Tag>
                ),
                width: 90,
              },
              {
                title: "Actions",
                key: "actions",
                width: 100,
                render: (_: unknown, record: ApiKey) => (
                  <Space>
                    <Popconfirm
                      title="Revoke this API key?"
                      onConfirm={() => handleRevokeKey(record.id)}
                    >
                      <Button
                        size="small"
                        icon={<DeleteOutlined />}
                        danger
                        disabled={record.status !== "active"}
                      >
                        Revoke
                      </Button>
                    </Popconfirm>
                  </Space>
                ),
              },
            ]}
          />
        </Space>
      ),
    },
    {
      key: "rate-limits",
      label: (
        <span>
          <ThunderboltOutlined /> Rate Limits
        </span>
      ),
      children: (
        <Space direction="vertical" size={16} style={{ width: "100%" }}>
          <Alert
            message="Rate limit configuration is managed in server config"
            type="info"
            showIcon
            style={{ background: "#1A1528", border: "1px solid #2D2640" }}
          />
          <Table
            dataSource={mockRateLimits}
            rowKey={(r) => `${r.method}-${r.endpoint}`}
            pagination={false}
            columns={[
              {
                title: "Endpoint",
                dataIndex: "endpoint",
                render: (v: string) => (
                  <Typography.Text code style={{ fontSize: 12 }}>
                    {v}
                  </Typography.Text>
                ),
              },
              {
                title: "Method",
                dataIndex: "method",
                render: (v: string) => (
                  <Tag color={v === "GET" ? "blue" : v === "POST" ? "green" : "orange"}>
                    {v}
                  </Tag>
                ),
                width: 80,
              },
              {
                title: "Window",
                dataIndex: "windowMs",
                render: (v: number) => formatDuration(v),
                width: 100,
              },
              {
                title: "Max Requests",
                dataIndex: "maxRequests",
                width: 120,
                render: (_: number, record: RateLimitConfig) => (
                  <InputNumber
                    value={record.maxRequests}
                    min={1}
                    size="small"
                    style={{ width: 80 }}
                    disabled
                  />
                ),
              },
              {
                title: "Current Usage",
                key: "usage",
                width: 200,
                render: (_: unknown, record: RateLimitConfig) => {
                  const pct = (record.currentUsage / record.maxRequests) * 100;
                  return (
                    <Space>
                      <Typography.Text>
                        {record.currentUsage}/{record.maxRequests}
                      </Typography.Text>
                      <Tag
                        color={pct > 80 ? "error" : pct > 50 ? "warning" : "success"}
                      >
                        {formatPercent(pct, 0)}
                      </Tag>
                    </Space>
                  );
                },
              },
            ]}
          />
        </Space>
      ),
    },
    {
      key: "webhooks",
      label: (
        <span>
          <GlobalOutlined /> Webhooks
        </span>
      ),
      children: (
        <Space direction="vertical" size={16} style={{ width: "100%" }}>
          <Alert
            message="Webhook management coming soon"
            type="info"
            showIcon
            style={{ background: "#1A1528", border: "1px solid #2D2640" }}
          />
          <Table
            dataSource={mockWebhooks}
            rowKey="id"
            pagination={false}
            columns={[
              {
                title: "URL",
                dataIndex: "url",
                render: (v: string) => (
                  <Space>
                    <Typography.Text code ellipsis style={{ maxWidth: 300, fontSize: 12, display: "block" }}>
                      {v}
                    </Typography.Text>
                    <Button
                      type="text"
                      size="small"
                      icon={<CopyOutlined />}
                      onClick={() => {
                        navigator.clipboard.writeText(v);
                        messageApi.success("URL copied");
                      }}
                    />
                  </Space>
                ),
              },
              {
                title: "Events",
                dataIndex: "events",
                render: (events: string[]) =>
                  events.map((e) => (
                    <Tag key={e} style={{ fontSize: 11 }}>
                      {e}
                    </Tag>
                  )),
              },
              {
                title: "Status",
                dataIndex: "status",
                render: (v: string) => (
                  <Tag color={getStatusColor(v)}>{v}</Tag>
                ),
                width: 90,
              },
              {
                title: "Success Rate",
                dataIndex: "successRate",
                render: (v: number) => (
                  <Tag color={v > 95 ? "success" : v > 80 ? "warning" : "error"}>
                    {formatPercent(v)}
                  </Tag>
                ),
                width: 110,
              },
              {
                title: "Last Delivery",
                dataIndex: "lastDelivery",
                render: (v: string | null) =>
                  v ? formatRelativeTime(v) : "-",
                width: 140,
              },
            ]}
          />
        </Space>
      ),
    },
    {
      key: "usage",
      label: (
        <span>
          <BarChartOutlined /> Usage Analytics
        </span>
      ),
      children: (
        <Spin spinning={isLoadingUsage}>
          <Space direction="vertical" size={16} style={{ width: "100%" }}>
            {isErrorUsage && (
              <Alert type="error" message="Failed to load usage analytics" showIcon closable />
            )}
            <Row gutter={[16, 16]}>
              <Col xs={12} sm={6}>
                <MetricPanel
                  title="Total Requests (24h)"
                  value={formatNumber(endpointUsage.reduce((s, e) => s + e.totalRequests, 0))}
                />
              </Col>
              <Col xs={12} sm={6}>
                <MetricPanel
                  title="Avg Response Time"
                  value={
                    endpointUsage.length > 0
                      ? Math.round(
                          endpointUsage.reduce((s, e) => s + e.avgResponseTime, 0) /
                            endpointUsage.length
                        )
                      : 0
                  }
                  suffix="ms"
                />
              </Col>
              <Col xs={12} sm={6}>
                <MetricPanel
                  title="Avg Error Rate"
                  value={
                    endpointUsage.length > 0
                      ? (
                          endpointUsage.reduce((s, e) => s + e.errorRate, 0) /
                          endpointUsage.length
                        ).toFixed(2)
                      : "0.00"
                  }
                  suffix="%"
                />
              </Col>
              <Col xs={12} sm={6}>
                <MetricPanel title="Endpoints" value={endpointUsage.length} />
              </Col>
            </Row>

            {endpointUsage.length > 0 && endpointUsage[0].history.length > 0 && (
              <TimeSeriesChart
                title="Requests Per Endpoint (24h)"
                data={endpointUsage[0].history as unknown as Record<string, unknown>[]}
                series={[{ dataKey: "count", name: `${endpointUsage[0].method} ${endpointUsage[0].endpoint}` }]}
                height={250}
              />
            )}

            <Table
              dataSource={endpointUsage}
              rowKey={(r) => `${r.method}-${r.endpoint}`}
              pagination={false}
              columns={[
                {
                  title: "Endpoint",
                  dataIndex: "endpoint",
                  render: (v: string) => (
                    <Typography.Text code style={{ fontSize: 12 }}>
                      {v}
                    </Typography.Text>
                  ),
                },
                {
                  title: "Method",
                  dataIndex: "method",
                  render: (v: string) => (
                    <Tag color={v === "GET" ? "blue" : "green"}>{v}</Tag>
                  ),
                  width: 80,
                },
                {
                  title: "Requests",
                  dataIndex: "totalRequests",
                  render: (v: number) => formatNumber(v),
                  sorter: (a: EndpointUsage, b: EndpointUsage) =>
                    a.totalRequests - b.totalRequests,
                  width: 110,
                },
                {
                  title: "Avg Response",
                  dataIndex: "avgResponseTime",
                  render: (v: number) => `${v}ms`,
                  sorter: (a: EndpointUsage, b: EndpointUsage) =>
                    a.avgResponseTime - b.avgResponseTime,
                  width: 120,
                },
                {
                  title: "Error Rate",
                  dataIndex: "errorRate",
                  render: (v: number) => (
                    <Tag color={v > 1 ? "error" : v > 0.5 ? "warning" : "success"}>
                      {formatPercent(v)}
                    </Tag>
                  ),
                  width: 100,
                },
              ]}
            />
          </Space>
        </Spin>
      ),
    },
  ];

  return (
    <Space direction="vertical" size={24} style={{ width: "100%" }}>
      {contextHolder}
      <Typography.Title level={3} style={{ margin: 0, color: COLORS.white }}>
        API Management
      </Typography.Title>

      <Card
        style={{ background: "#1A1528", border: "1px solid #2D2640" }}
        styles={{ body: { padding: 0 } }}
      >
        <Tabs
          defaultActiveKey="api-keys"
          items={tabItems}
          tabBarStyle={{
            padding: "0 16px",
            borderBottom: "1px solid #2D2640",
          }}
          style={{ padding: "0 16px 16px" }}
        />
      </Card>

      {/* Create API Key Modal */}
      <Modal
        title="Create API Key"
        open={isCreateKeyModalOpen}
        onOk={handleCreateKey}
        onCancel={() => setIsCreateKeyModalOpen(false)}
        okText="Create"
        confirmLoading={isSubmitting}
      >
        <Form form={form} layout="vertical">
          <Form.Item
            name="name"
            label="Key Name"
            rules={[{ required: true, message: "Please enter a name" }]}
          >
            <Input placeholder="e.g. Mobile App Production" />
          </Form.Item>
          <Form.Item
            name="scopes"
            label="Scopes"
            rules={[{ required: true, message: "Select at least one scope" }]}
          >
            <Select
              mode="multiple"
              placeholder="Select scopes"
              options={[
                { value: "tasks:read", label: "tasks:read" },
                { value: "tasks:write", label: "tasks:write" },
                { value: "projects:read", label: "projects:read" },
                { value: "projects:write", label: "projects:write" },
                { value: "content:read", label: "content:read" },
                { value: "notifications:write", label: "notifications:write" },
                { value: "deploy:write", label: "deploy:write" },
                { value: "health:read", label: "health:read" },
              ]}
            />
          </Form.Item>
          <Form.Item name="expiresIn" label="Expires In" initialValue="90d">
            <Select
              placeholder="Select expiration"
              options={EXPIRY_OPTIONS.map((o) => ({
                value: o.value,
                label: o.label,
              }))}
            />
          </Form.Item>
        </Form>
      </Modal>

      {/* New Key Display Modal (shown once after creation) */}
      <Modal
        title="API Key Created"
        open={newKeyModalOpen}
        onOk={() => {
          setNewKeyModalOpen(false);
          setNewKeyValue("");
        }}
        onCancel={() => {
          setNewKeyModalOpen(false);
          setNewKeyValue("");
        }}
        okText="Done"
        cancelButtonProps={{ style: { display: "none" } }}
      >
        <Space direction="vertical" size={12} style={{ width: "100%" }}>
          <Alert
            message="Copy this key now. It will not be shown again."
            type="warning"
            showIcon
          />
          <Input.TextArea
            value={newKeyValue}
            readOnly
            autoSize={{ minRows: 2 }}
            style={{ fontFamily: "monospace", fontSize: 13 }}
          />
          <Button
            type="primary"
            icon={<CopyOutlined />}
            onClick={() => {
              navigator.clipboard.writeText(newKeyValue);
              messageApi.success("API key copied to clipboard");
            }}
          >
            Copy to Clipboard
          </Button>
        </Space>
      </Modal>
    </Space>
  );
};
