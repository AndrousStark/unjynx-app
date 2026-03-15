import React, { useState } from "react";
import {
  Table,
  Typography,
  Button,
  Card,
  Space,
  Tag,
  Switch,
  Slider,
  message,
  Row,
  Col,
  Popconfirm,
  Tooltip,
} from "antd";
import {
  PlusOutlined,
  DeleteOutlined,
  WarningOutlined,
  EyeOutlined,
} from "@ant-design/icons";
import { useTable } from "@refinedev/antd";
import { useDelete, useUpdate } from "@refinedev/core";
import { StatusBadge } from "../../components/common/StatusBadge";
import { formatDate, formatRelativeTime } from "../../utils/formatters";
import { FLAG_TYPES } from "../../utils/constants";
import { FlagDetail } from "./FlagDetail";
import type { FeatureFlagRecord, FlagStatus } from "../../types";

const { Title, Text } = Typography;

const STALE_THRESHOLD_DAYS = 30;

function isStale(updatedAt: string): boolean {
  const updated = new Date(updatedAt);
  const now = new Date();
  const diffMs = now.getTime() - updated.getTime();
  const diffDays = diffMs / (1000 * 60 * 60 * 24);
  return diffDays > STALE_THRESHOLD_DAYS;
}

export const FlagList: React.FC = () => {
  const [selectedFlagId, setSelectedFlagId] = useState<string | null>(null);
  const [detailOpen, setDetailOpen] = useState(false);
  const [createOpen, setCreateOpen] = useState(false);

  const { tableProps } = useTable<FeatureFlagRecord>({
    resource: "feature-flags",
    pagination: { mode: "off" },
  });

  const { mutate: updateFlag } = useUpdate();
  const { mutate: deleteFlag } = useDelete();

  const handleToggle = (id: string, currentStatus: FlagStatus) => {
    const newStatus: FlagStatus =
      currentStatus === "enabled" ? "disabled" : "enabled";
    updateFlag(
      {
        resource: "feature-flags",
        id,
        values: { status: newStatus },
      },
      {
        onSuccess: () => {
          message.success(`Flag ${newStatus}`);
        },
      },
    );
  };

  const handlePercentageChange = (id: string, percentage: number) => {
    updateFlag({
      resource: "feature-flags",
      id,
      values: { status: "percentage", percentage },
    });
  };

  const handleDelete = (id: string) => {
    deleteFlag(
      { resource: "feature-flags", id },
      {
        onSuccess: () => {
          message.success("Flag deleted");
        },
      },
    );
  };

  const columns = [
    {
      title: "Key",
      dataIndex: "key",
      key: "key",
      render: (key: string, record: FeatureFlagRecord) => (
        <Space>
          <Text code>{key}</Text>
          {isStale(record.updatedAt) && (
            <Tooltip title="Stale flag (30+ days)">
              <WarningOutlined style={{ color: "#FAAD14" }} />
            </Tooltip>
          )}
        </Space>
      ),
    },
    {
      title: "Name",
      dataIndex: "name",
      key: "name",
      render: (name: string) => <Text strong>{name}</Text>,
    },
    {
      title: "Status",
      dataIndex: "status",
      key: "status",
      width: 130,
      render: (status: string, record: FeatureFlagRecord) => (
        <Space>
          <Switch
            checked={status === "enabled" || status === "percentage"}
            onChange={() =>
              handleToggle(record.id, status as FlagStatus)
            }
            size="small"
          />
          <StatusBadge status={status} />
        </Space>
      ),
    },
    {
      title: "Rollout",
      dataIndex: "percentage",
      key: "percentage",
      width: 180,
      render: (percentage: number, record: FeatureFlagRecord) => {
        if (record.status === "percentage") {
          return (
            <Slider
              min={0}
              max={100}
              value={percentage}
              onChange={(val) => handlePercentageChange(record.id, val)}
              style={{ width: 120, margin: 0 }}
              tooltip={{ formatter: (val) => `${val}%` }}
            />
          );
        }
        return <Text type="secondary">-</Text>;
      },
    },
    {
      title: "Updated",
      dataIndex: "updatedAt",
      key: "updatedAt",
      width: 130,
      render: (date: string) => formatRelativeTime(date),
    },
    {
      title: "Actions",
      key: "actions",
      width: 100,
      render: (_: unknown, record: FeatureFlagRecord) => (
        <Space>
          <Button
            type="text"
            icon={<EyeOutlined />}
            size="small"
            onClick={() => {
              setSelectedFlagId(record.id);
              setDetailOpen(true);
            }}
          />
          <Popconfirm
            title="Delete this flag?"
            onConfirm={() => handleDelete(record.id)}
          >
            <Button
              type="text"
              icon={<DeleteOutlined />}
              danger
              size="small"
            />
          </Popconfirm>
        </Space>
      ),
    },
  ];

  return (
    <div>
      <Row justify="space-between" align="middle" style={{ marginBottom: 24 }}>
        <Col>
          <Title level={3} style={{ margin: 0 }}>
            Feature Flags
          </Title>
        </Col>
        <Col>
          <Button
            type="primary"
            icon={<PlusOutlined />}
            onClick={() => {
              setSelectedFlagId(null);
              setCreateOpen(true);
            }}
          >
            New Flag
          </Button>
        </Col>
      </Row>

      {/* Flag type legend */}
      <Card bordered={false} style={{ marginBottom: 16 }}>
        <Space>
          <Text type="secondary">Types:</Text>
          {FLAG_TYPES.map((ft) => (
            <Tag key={ft.value} color={ft.color}>
              {ft.label}
            </Tag>
          ))}
          <Text type="secondary" style={{ marginLeft: 16 }}>
            <WarningOutlined style={{ color: "#FAAD14" }} /> = Stale (30+ days)
          </Text>
        </Space>
      </Card>

      <Card bordered={false}>
        <Table
          {...tableProps}
          columns={columns}
          rowKey="id"
          scroll={{ x: 800 }}
          size="middle"
        />
      </Card>

      <FlagDetail
        flagId={selectedFlagId}
        open={detailOpen || createOpen}
        isCreate={createOpen}
        onClose={() => {
          setDetailOpen(false);
          setCreateOpen(false);
          setSelectedFlagId(null);
        }}
      />
    </div>
  );
};
