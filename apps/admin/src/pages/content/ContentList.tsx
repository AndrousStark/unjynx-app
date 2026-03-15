import React from "react";
import {
  Table,
  Input,
  Select,
  Space,
  Typography,
  Button,
  Card,
  Row,
  Col,
  Popconfirm,
  message,
  Tag,
} from "antd";
import {
  SearchOutlined,
  PlusOutlined,
  EditOutlined,
  DeleteOutlined,
  CalendarOutlined,
} from "@ant-design/icons";
import { useTable } from "@refinedev/antd";
import { useDelete, useNavigation } from "@refinedev/core";
import { StatusBadge } from "../../components/common/StatusBadge";
import { formatDate, truncateText, categoryLabel } from "../../utils/formatters";
import { CONTENT_CATEGORIES } from "../../utils/constants";
import type { ContentRecord } from "../../types";

const { Title, Text } = Typography;

export const ContentList: React.FC = () => {
  const { push } = useNavigation();
  const { tableProps, setFilters } = useTable<ContentRecord>({
    resource: "content",
    pagination: { pageSize: 20, mode: "server" },
    sorters: { initial: [{ field: "createdAt", order: "desc" }] },
  });

  const { mutate: deleteContent } = useDelete();

  const handleDelete = (id: string) => {
    deleteContent(
      { resource: "content", id },
      {
        onSuccess: () => {
          message.success("Content deleted");
        },
      },
    );
  };

  const columns = [
    {
      title: "Category",
      dataIndex: "category",
      key: "category",
      width: 160,
      render: (category: string) => (
        <Tag color="purple">{categoryLabel(category)}</Tag>
      ),
    },
    {
      title: "Content",
      dataIndex: "content",
      key: "content",
      render: (content: string) => (
        <Text>{truncateText(content, 100)}</Text>
      ),
    },
    {
      title: "Author",
      dataIndex: "author",
      key: "author",
      width: 150,
      render: (author: string | null) => author ?? <Text type="secondary">-</Text>,
    },
    {
      title: "Status",
      dataIndex: "isActive",
      key: "status",
      width: 100,
      render: (isActive: boolean) => (
        <StatusBadge status={isActive ? "published" : "draft"} />
      ),
    },
    {
      title: "Created",
      dataIndex: "createdAt",
      key: "createdAt",
      width: 120,
      sorter: true,
      render: (date: string) => formatDate(date),
    },
    {
      title: "Actions",
      key: "actions",
      width: 100,
      render: (_: unknown, record: ContentRecord) => (
        <Space>
          <Button
            type="text"
            icon={<EditOutlined />}
            size="small"
            onClick={() => push(`/content/edit/${record.id}`)}
          />
          <Popconfirm
            title="Delete this content?"
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
            Content Management
          </Title>
        </Col>
        <Col>
          <Space>
            <Button
              icon={<CalendarOutlined />}
              onClick={() => push("/content/calendar")}
            >
              Calendar
            </Button>
            <Button
              type="primary"
              icon={<PlusOutlined />}
              onClick={() => push("/content/create")}
            >
              New Content
            </Button>
          </Space>
        </Col>
      </Row>

      <Card bordered={false} style={{ marginBottom: 16 }}>
        <Row gutter={[16, 16]} align="middle">
          <Col xs={24} sm={10}>
            <Input
              prefix={<SearchOutlined />}
              placeholder="Search content..."
              allowClear
              onChange={(e) => {
                setFilters([
                  { field: "search", operator: "eq", value: e.target.value },
                ]);
              }}
            />
          </Col>
          <Col xs={24} sm={8}>
            <Select
              placeholder="Filter by Category"
              allowClear
              style={{ width: "100%" }}
              options={CONTENT_CATEGORIES.map((c) => ({
                value: c.value,
                label: c.label,
              }))}
              onChange={(value) => {
                setFilters([
                  { field: "category", operator: "eq", value },
                ]);
              }}
            />
          </Col>
          <Col xs={24} sm={6}>
            <Select
              placeholder="Filter by Status"
              allowClear
              style={{ width: "100%" }}
              options={[
                { value: "true", label: "Active" },
                { value: "false", label: "Inactive" },
              ]}
              onChange={(value) => {
                setFilters([
                  { field: "isActive", operator: "eq", value },
                ]);
              }}
            />
          </Col>
        </Row>
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
    </div>
  );
};
