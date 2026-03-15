import React, { useState, useCallback } from "react";
import {
  Table,
  Typography,
  Button,
  Card,
  Space,
  Tag,
  message,
  Popconfirm,
  Row,
  Col,
  Spin,
} from "antd";
import {
  ArrowLeftOutlined,
  ReloadOutlined,
  RetweetOutlined,
} from "@ant-design/icons";
import { useCustom, useNavigation } from "@refinedev/core";
import { formatDateTime } from "../../utils/formatters";
import { API_BASE_URL, API_ADMIN_PREFIX } from "../../utils/constants";
import { getAccessToken } from "../../providers/auth-provider";

const { Title, Text } = Typography;

interface FailedAttempt {
  id: string;
  notificationId: string;
  channel: string;
  provider: string;
  status: string;
  attemptNumber: number;
  maxAttempts: number;
  errorType: string | null;
  errorMessage: string | null;
  errorCode: string | null;
  failedAt: string | null;
  createdAt: string;
}

export const FailedNotifications: React.FC = () => {
  const { push } = useNavigation();
  const [page, setPage] = useState(1);
  const [retrying, setRetrying] = useState<string | null>(null);
  const [retryingAll, setRetryingAll] = useState(false);

  const { data, isLoading, refetch } = useCustom<FailedAttempt[]>({
    url: `${API_BASE_URL}${API_ADMIN_PREFIX}/notifications/failed`,
    method: "get",
    config: { query: { page, limit: 20 } },
  });

  const items = (data?.data as unknown as FailedAttempt[]) ?? [];
  const total = (data as unknown as { data: { meta?: { total?: number } } })?.data?.meta?.total ?? items.length;

  const handleRetry = useCallback(async (id: string) => {
    setRetrying(id);
    try {
      const token = getAccessToken();
      const res = await fetch(
        `${API_BASE_URL}${API_ADMIN_PREFIX}/notifications/${id}/retry`,
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        },
      );
      if (res.ok) {
        message.success("Notification queued for retry");
        refetch();
      } else {
        const body = await res.json().catch(() => ({}));
        message.error(body.error ?? "Retry failed");
      }
    } catch {
      message.error("Network error");
    } finally {
      setRetrying(null);
    }
  }, [refetch]);

  const handleRetryAll = useCallback(async () => {
    setRetryingAll(true);
    try {
      const token = getAccessToken();
      const res = await fetch(
        `${API_BASE_URL}${API_ADMIN_PREFIX}/notifications/retry-all`,
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        },
      );
      if (res.ok) {
        const body = await res.json();
        message.success(`Retried ${body.data?.retriedCount ?? 0} notifications`);
        refetch();
      } else {
        message.error("Retry all failed");
      }
    } catch {
      message.error("Network error");
    } finally {
      setRetryingAll(false);
    }
  }, [refetch]);

  const columns = [
    {
      title: "ID",
      dataIndex: "id",
      key: "id",
      width: 100,
      render: (id: string) => <Text code>{id.slice(0, 8)}</Text>,
    },
    {
      title: "Channel",
      dataIndex: "channel",
      key: "channel",
      width: 110,
      render: (channel: string) => (
        <Tag style={{ textTransform: "capitalize" }}>{channel}</Tag>
      ),
    },
    {
      title: "Provider",
      dataIndex: "provider",
      key: "provider",
      width: 120,
    },
    {
      title: "Error",
      key: "error",
      render: (_: unknown, record: FailedAttempt) => (
        <Text type="danger" style={{ fontSize: 13 }}>
          {record.errorMessage ?? record.errorType ?? "Unknown error"}
        </Text>
      ),
    },
    {
      title: "Attempts",
      dataIndex: "attemptNumber",
      key: "attemptNumber",
      width: 90,
      render: (attempts: number, record: FailedAttempt) => (
        <Tag color={attempts >= record.maxAttempts ? "error" : "warning"}>
          {attempts}/{record.maxAttempts}
        </Tag>
      ),
    },
    {
      title: "Failed At",
      dataIndex: "failedAt",
      key: "failedAt",
      width: 180,
      render: (date: string | null) => (date ? formatDateTime(date) : "-"),
    },
    {
      title: "Action",
      key: "action",
      width: 80,
      render: (_: unknown, record: FailedAttempt) => (
        <Popconfirm
          title="Retry this notification?"
          onConfirm={() => handleRetry(record.id)}
        >
          <Button
            type="text"
            icon={<RetweetOutlined />}
            size="small"
            loading={retrying === record.id}
          />
        </Popconfirm>
      ),
    },
  ];

  if (isLoading) {
    return (
      <div style={{ textAlign: "center", padding: 80 }}>
        <Spin size="large" />
      </div>
    );
  }

  return (
    <div>
      <Row justify="space-between" align="middle" style={{ marginBottom: 24 }}>
        <Col>
          <Space>
            <Button
              icon={<ArrowLeftOutlined />}
              onClick={() => push("/notifications")}
            >
              Back
            </Button>
            <Title level={3} style={{ margin: 0 }}>
              Failed Notifications ({total})
            </Title>
          </Space>
        </Col>
        <Col>
          <Space>
            <Button icon={<ReloadOutlined />} onClick={() => refetch()}>
              Refresh
            </Button>
            <Popconfirm
              title="Retry all failed notifications?"
              onConfirm={handleRetryAll}
            >
              <Button
                type="primary"
                icon={<ReloadOutlined />}
                danger
                loading={retryingAll}
              >
                Retry All
              </Button>
            </Popconfirm>
          </Space>
        </Col>
      </Row>

      <Card bordered={false}>
        <Table
          dataSource={items}
          columns={columns}
          rowKey="id"
          scroll={{ x: 800 }}
          size="middle"
          pagination={{
            current: page,
            pageSize: 20,
            total,
            onChange: (p) => setPage(p),
          }}
        />
      </Card>
    </div>
  );
};
