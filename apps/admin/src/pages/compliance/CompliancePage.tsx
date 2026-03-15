import React from "react";
import {
  Typography,
  Card,
  Table,
  Tabs,
  Tag,
  Input,
  Row,
  Col,
  Button,
  Space,
  Alert,
  List,
  Spin,
  Statistic,
} from "antd";
import {
  SearchOutlined,
  DownloadOutlined,
  SafetyOutlined,
  FileProtectOutlined,
  AuditOutlined,
  ClockCircleOutlined,
} from "@ant-design/icons";
import { useTable } from "@refinedev/antd";
import { useCustom } from "@refinedev/core";
import { formatDateTime, formatDate, formatNumber } from "../../utils/formatters";
import { API_BASE_URL, API_ADMIN_PREFIX, BRAND_COLORS } from "../../utils/constants";
import type { AuditLogRecord } from "../../types";

const { Title, Text } = Typography;

// Data retention policies (config, not DB)
const RETENTION_POLICIES = [
  {
    category: "User Profiles",
    retention: "Account lifetime + 30 days",
    legal: "DPDP Act 2023",
    description: "Retained while account is active. Deleted 30 days after account deletion request.",
  },
  {
    category: "Task Data",
    retention: "Account lifetime + 30 days",
    legal: "DPDP Act 2023",
    description: "User-generated task data tied to account lifecycle.",
  },
  {
    category: "Notification Logs",
    retention: "90 days",
    legal: "Business operations",
    description: "Delivery logs retained for debugging and analytics.",
  },
  {
    category: "Audit Logs",
    retention: "2 years",
    legal: "Compliance requirement",
    description: "Admin actions retained for security and compliance audits.",
  },
  {
    category: "Payment Records",
    retention: "7 years",
    legal: "Tax/Financial regulations",
    description: "Required by Indian tax law and payment processor agreements.",
  },
  {
    category: "Analytics Events",
    retention: "1 year",
    legal: "Business operations",
    description: "Anonymized after 90 days, deleted after 1 year.",
  },
];

interface ComplianceSummary {
  totalUsers: number;
  usersWithEmail: number;
  usersWithoutEmail: number;
  dataRetentionDays: number;
  auditLogEntries: number;
  oldestAuditEntry: string | null;
}

export const CompliancePage: React.FC = () => {
  const { tableProps, setFilters } = useTable<AuditLogRecord>({
    resource: "audit-log",
    pagination: { pageSize: 20, mode: "server" },
    sorters: { initial: [{ field: "createdAt", order: "desc" }] },
  });

  const { data: summaryData, isLoading: summaryLoading } = useCustom<ComplianceSummary>({
    url: `${API_BASE_URL}${API_ADMIN_PREFIX}/compliance/summary`,
    method: "get",
  });

  const summary = summaryData?.data as unknown as ComplianceSummary | undefined;

  const auditColumns = [
    {
      title: "Time",
      dataIndex: "createdAt",
      key: "createdAt",
      width: 180,
      render: (date: string) => formatDateTime(date),
    },
    {
      title: "Action",
      dataIndex: "action",
      key: "action",
      width: 160,
      render: (action: string) => <Tag color="purple">{action}</Tag>,
    },
    {
      title: "User ID",
      dataIndex: "userId",
      key: "userId",
      width: 140,
      render: (id: string | null) =>
        id ? (
          <Text code style={{ fontSize: 11 }}>
            {id.slice(0, 12)}...
          </Text>
        ) : (
          <Text type="secondary">-</Text>
        ),
    },
    {
      title: "Resource",
      key: "resource",
      width: 150,
      render: (_: unknown, record: AuditLogRecord) => (
        <Space>
          <Tag>{record.entityType}</Tag>
          {record.entityId && (
            <Text type="secondary" style={{ fontSize: 11 }}>
              {record.entityId.slice(0, 8)}
            </Text>
          )}
        </Space>
      ),
    },
    {
      title: "Details",
      dataIndex: "metadata",
      key: "metadata",
      render: (metadata: string | undefined) => {
        if (!metadata) return <Text type="secondary">-</Text>;
        try {
          const parsed = JSON.parse(metadata);
          return (
            <Text style={{ fontSize: 12 }}>
              {JSON.stringify(parsed).slice(0, 80)}
            </Text>
          );
        } catch {
          return <Text style={{ fontSize: 12 }}>{metadata.slice(0, 80)}</Text>;
        }
      },
    },
    {
      title: "IP",
      dataIndex: "ipAddress",
      key: "ipAddress",
      width: 120,
      render: (ip: string | undefined) =>
        ip ?? <Text type="secondary">-</Text>,
    },
  ];

  return (
    <div>
      <Title level={3} style={{ marginBottom: 24 }}>
        Compliance
      </Title>

      {/* Summary Stats */}
      {!summaryLoading && summary && (
        <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
          <Col xs={12} sm={6}>
            <Card bordered={false} size="small">
              <Statistic title="Total Users" value={summary.totalUsers} />
            </Card>
          </Col>
          <Col xs={12} sm={6}>
            <Card bordered={false} size="small">
              <Statistic title="With Email" value={summary.usersWithEmail} />
            </Card>
          </Col>
          <Col xs={12} sm={6}>
            <Card bordered={false} size="small">
              <Statistic title="Audit Entries" value={formatNumber(summary.auditLogEntries)} />
            </Card>
          </Col>
          <Col xs={12} sm={6}>
            <Card bordered={false} size="small">
              <Statistic
                title="Oldest Audit"
                value={summary.oldestAuditEntry ? formatDate(summary.oldestAuditEntry) : "None"}
                valueStyle={{ fontSize: 16 }}
              />
            </Card>
          </Col>
        </Row>
      )}

      <Tabs
        defaultActiveKey="audit"
        items={[
          {
            key: "audit",
            label: (
              <Space>
                <AuditOutlined />
                Audit Log
              </Space>
            ),
            children: (
              <div>
                <Card bordered={false} style={{ marginBottom: 16 }}>
                  <Row gutter={[16, 16]} align="middle">
                    <Col xs={24} sm={8}>
                      <Input
                        prefix={<SearchOutlined />}
                        placeholder="Filter by action..."
                        allowClear
                        onChange={(e) => {
                          setFilters([
                            {
                              field: "action",
                              operator: "eq",
                              value: e.target.value,
                            },
                          ]);
                        }}
                      />
                    </Col>
                    <Col xs={24} sm={8}>
                      <Input
                        placeholder="Filter by user ID..."
                        allowClear
                        onChange={(e) => {
                          setFilters([
                            {
                              field: "userId",
                              operator: "eq",
                              value: e.target.value,
                            },
                          ]);
                        }}
                      />
                    </Col>
                    <Col xs={24} sm={8}>
                      <Button icon={<DownloadOutlined />}>
                        Export Audit Log
                      </Button>
                    </Col>
                  </Row>
                </Card>

                <Card bordered={false}>
                  <Table
                    {...tableProps}
                    columns={auditColumns}
                    rowKey="id"
                    scroll={{ x: 900 }}
                    size="middle"
                  />
                </Card>
              </div>
            ),
          },
          {
            key: "gdpr",
            label: (
              <Space>
                <FileProtectOutlined />
                GDPR / DPDP
              </Space>
            ),
            children: (
              <div>
                <Alert
                  message="India DPDP Act 2023 Compliance"
                  description="All data handling must comply with the Digital Personal Data Protection Act 2023 (deadline: May 2027). Data export requests must be fulfilled within 30 days."
                  type="warning"
                  showIcon
                  style={{ marginBottom: 16 }}
                />

                <Card bordered={false}>
                  <Title level={5}>Compliance Status</Title>
                  <Row gutter={[16, 16]} style={{ marginTop: 16 }}>
                    <Col xs={24} sm={8}>
                      <Card size="small" bordered>
                        <Statistic
                          title="Users With PII (Email)"
                          value={summary?.usersWithEmail ?? 0}
                          valueStyle={{ color: BRAND_COLORS.violet }}
                        />
                      </Card>
                    </Col>
                    <Col xs={24} sm={8}>
                      <Card size="small" bordered>
                        <Statistic
                          title="Users Without Email"
                          value={summary?.usersWithoutEmail ?? 0}
                        />
                      </Card>
                    </Col>
                    <Col xs={24} sm={8}>
                      <Card size="small" bordered>
                        <Statistic
                          title="Data Retention (days)"
                          value={summary?.dataRetentionDays ?? 365}
                        />
                      </Card>
                    </Col>
                  </Row>
                  <Alert
                    message="Data Subject Requests"
                    description="Data export and deletion requests can be processed via the User Management page. Use 'Delete User' for DPDP deletion requests (cascades all user data)."
                    type="info"
                    showIcon
                    style={{ marginTop: 16 }}
                  />
                </Card>
              </div>
            ),
          },
          {
            key: "consent",
            label: (
              <Space>
                <SafetyOutlined />
                Consent
              </Space>
            ),
            children: (
              <Card bordered={false}>
                <Title level={5} style={{ marginBottom: 16 }}>
                  Consent Management
                </Title>
                <Alert
                  message="Consent is managed via Logto OIDC"
                  description="Users consent to Terms of Service and Privacy Policy during Logto signup. Additional consents (marketing, notifications) are managed in the app's notification preferences."
                  type="info"
                  showIcon
                  style={{ marginBottom: 16 }}
                />
                <Table
                  dataSource={[
                    { type: "Terms of Service", status: "Collected at signup", required: true },
                    { type: "Privacy Policy", status: "Collected at signup", required: true },
                    { type: "Push Notifications", status: "In-app opt-in", required: false },
                    { type: "WhatsApp Messages", status: "Channel verification", required: false },
                    { type: "Email Notifications", status: "Channel verification", required: false },
                  ]}
                  rowKey="type"
                  size="middle"
                  pagination={false}
                  columns={[
                    {
                      title: "Consent Type",
                      dataIndex: "type",
                      key: "type",
                      render: (type: string) => <Text strong>{type}</Text>,
                    },
                    {
                      title: "Required",
                      dataIndex: "required",
                      key: "required",
                      width: 100,
                      render: (required: boolean) =>
                        required ? (
                          <Tag color="red">Required</Tag>
                        ) : (
                          <Tag>Optional</Tag>
                        ),
                    },
                    {
                      title: "Collection Method",
                      dataIndex: "status",
                      key: "status",
                      render: (status: string) => <Tag color="success">{status}</Tag>,
                    },
                  ]}
                />
              </Card>
            ),
          },
          {
            key: "retention",
            label: (
              <Space>
                <ClockCircleOutlined />
                Data Retention
              </Space>
            ),
            children: (
              <Card bordered={false}>
                <Title level={5} style={{ marginBottom: 16 }}>
                  Data Retention Policies
                </Title>
                <List
                  dataSource={RETENTION_POLICIES}
                  renderItem={(policy) => (
                    <List.Item>
                      <List.Item.Meta
                        title={
                          <Space>
                            <Text strong>{policy.category}</Text>
                            <Tag color="blue">{policy.retention}</Tag>
                            <Tag>{policy.legal}</Tag>
                          </Space>
                        }
                        description={policy.description}
                      />
                    </List.Item>
                  )}
                />
              </Card>
            ),
          },
        ]}
      />
    </div>
  );
};
