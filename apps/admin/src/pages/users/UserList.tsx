import React, { useState } from "react";
import {
  Table,
  Input,
  Select,
  Space,
  Avatar,
  Typography,
  Button,
  Tag,
  DatePicker,
  Row,
  Col,
  Card,
  Popconfirm,
  message,
} from "antd";
import {
  SearchOutlined,
  UserOutlined,
  EyeOutlined,
  StopOutlined,
  PlusOutlined,
  DeleteOutlined,
} from "@ant-design/icons";
import { useTable } from "@refinedev/antd";
import { useUpdate, useDelete } from "@refinedev/core";
import { UserDetail } from "./UserDetail";
import { CreateUserModal } from "./CreateUserModal";
import { StatusBadge } from "../../components/common/StatusBadge";
import {
  formatDate,
  formatRelativeTime,
  planColor,
  adminRoleColor,
  adminRoleLabel,
} from "../../utils/formatters";
import {
  PLAN_OPTIONS,
  ADMIN_ROLE_OPTIONS,
  BRAND_COLORS,
} from "../../utils/constants";
import type { UserRecord } from "../../types";

const { Title, Text } = Typography;
const { RangePicker } = DatePicker;

export const UserList: React.FC = () => {
  const [selectedUserId, setSelectedUserId] = useState<string | null>(null);
  const [detailOpen, setDetailOpen] = useState(false);
  const [createOpen, setCreateOpen] = useState(false);

  const { tableProps, setFilters, tableQuery } = useTable<UserRecord>({
    resource: "users",
    pagination: { pageSize: 20, mode: "server" },
    sorters: { initial: [{ field: "createdAt", order: "desc" }] },
  });

  const { mutate: updateUser } = useUpdate();
  const { mutate: deleteUser } = useDelete();

  const totalCount = tableQuery?.data?.total ?? 0;
  const currentCount = tableProps?.dataSource?.length ?? 0;

  const handleViewUser = (userId: string) => {
    setSelectedUserId(userId);
    setDetailOpen(true);
  };

  const handleBanToggle = (record: UserRecord) => {
    updateUser(
      {
        resource: "users",
        id: record.id,
        values: { isBanned: !record.isBanned },
      },
      {
        onSuccess: () => {
          message.success(
            record.isBanned ? "User unbanned" : "User banned",
          );
        },
        onError: (error) => {
          message.error(error?.message ?? "Failed to update user");
        },
      },
    );
  };

  const handleDeleteUser = (record: UserRecord) => {
    deleteUser(
      {
        resource: "users",
        id: record.id,
      },
      {
        onSuccess: () => {
          message.success("User deleted");
        },
        onError: (error) => {
          message.error(error?.message ?? "Failed to delete user");
        },
      },
    );
  };

  const handleCreateSuccess = () => {
    tableQuery?.refetch();
  };

  const handleUserDeleted = () => {
    tableQuery?.refetch();
  };

  const columns = [
    {
      title: "User",
      dataIndex: "name",
      key: "name",
      render: (name: string, record: UserRecord) => (
        <Space>
          <Avatar
            size="small"
            src={record.avatarUrl}
            icon={!record.avatarUrl ? <UserOutlined /> : undefined}
          />
          <div>
            <Text strong>{name ?? "Unknown"}</Text>
            <br />
            <Text type="secondary" style={{ fontSize: 12 }}>
              {record.email}
            </Text>
          </div>
        </Space>
      ),
    },
    {
      title: "Plan",
      dataIndex: "plan",
      key: "plan",
      width: 100,
      render: (plan: string) => (
        <Tag color={planColor(plan ?? "free")}>
          {(plan ?? "free").toUpperCase()}
        </Tag>
      ),
    },
    {
      title: "Role",
      dataIndex: "adminRole",
      key: "adminRole",
      width: 120,
      render: (role: string | undefined) => (
        <Tag color={adminRoleColor(role ?? "user")}>
          {adminRoleLabel(role ?? "user")}
        </Tag>
      ),
    },
    {
      title: "Status",
      dataIndex: "isBanned",
      key: "status",
      width: 110,
      render: (isBanned: boolean) => (
        <StatusBadge status={isBanned ? "banned" : "active"} />
      ),
    },
    {
      title: "Signed Up",
      dataIndex: "createdAt",
      key: "createdAt",
      width: 130,
      sorter: true,
      render: (date: string) => formatDate(date),
    },
    {
      title: "Last Active",
      dataIndex: "updatedAt",
      key: "updatedAt",
      width: 140,
      render: (date: string) => formatRelativeTime(date),
    },
    {
      title: "Actions",
      key: "actions",
      width: 140,
      render: (_: unknown, record: UserRecord) => (
        <Space>
          <Button
            type="text"
            icon={<EyeOutlined />}
            onClick={() => handleViewUser(record.id)}
            size="small"
            title="View"
          />
          <Popconfirm
            title={record.isBanned ? "Unban this user?" : "Ban this user?"}
            onConfirm={() => handleBanToggle(record)}
          >
            <Button
              type="text"
              icon={<StopOutlined />}
              danger={!record.isBanned}
              size="small"
              title={record.isBanned ? "Unban" : "Ban"}
            />
          </Popconfirm>
          <Popconfirm
            title="Delete this user?"
            description="This action cannot be undone."
            onConfirm={() => handleDeleteUser(record)}
            okButtonProps={{ danger: true }}
          >
            <Button
              type="text"
              icon={<DeleteOutlined />}
              danger
              size="small"
              title="Delete"
            />
          </Popconfirm>
        </Space>
      ),
    },
  ];

  return (
    <div>
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          marginBottom: 24,
        }}
      >
        <Title level={3} style={{ margin: 0 }}>
          User Management
        </Title>
        <Button
          type="primary"
          icon={<PlusOutlined />}
          onClick={() => setCreateOpen(true)}
          style={{
            backgroundColor: BRAND_COLORS.gold,
            borderColor: BRAND_COLORS.gold,
            color: BRAND_COLORS.midnight,
            fontWeight: 600,
          }}
        >
          Create User
        </Button>
      </div>

      <Card bordered={false} style={{ marginBottom: 16 }}>
        <Row gutter={[16, 16]} align="middle">
          <Col xs={24} sm={7}>
            <Input
              prefix={<SearchOutlined />}
              placeholder="Search by name or email..."
              allowClear
              onChange={(e) => {
                setFilters([
                  { field: "search", operator: "eq", value: e.target.value },
                ]);
              }}
            />
          </Col>
          <Col xs={24} sm={5}>
            <Select
              placeholder="Filter by Plan"
              allowClear
              style={{ width: "100%" }}
              options={PLAN_OPTIONS.map((p) => ({
                value: p.value,
                label: p.label,
              }))}
              onChange={(value) => {
                setFilters([
                  { field: "plan", operator: "eq", value },
                ]);
              }}
            />
          </Col>
          <Col xs={24} sm={5}>
            <Select
              placeholder="Filter by Role"
              allowClear
              style={{ width: "100%" }}
              options={ADMIN_ROLE_OPTIONS.map((r) => ({
                value: r.value,
                label: r.label,
              }))}
              onChange={(value) => {
                setFilters([
                  { field: "adminRole", operator: "eq", value },
                ]);
              }}
            />
          </Col>
          <Col xs={24} sm={4}>
            <Select
              placeholder="Filter by Status"
              allowClear
              style={{ width: "100%" }}
              options={[
                { value: "active", label: "Active" },
                { value: "suspended", label: "Suspended" },
                { value: "banned", label: "Banned" },
              ]}
              onChange={(value) => {
                setFilters([
                  { field: "status", operator: "eq", value },
                ]);
              }}
            />
          </Col>
          <Col xs={24} sm={3}>
            <RangePicker style={{ width: "100%" }} />
          </Col>
        </Row>
      </Card>

      <Card bordered={false}>
        <Text type="secondary" style={{ display: "block", marginBottom: 12 }}>
          Showing {currentCount} of {totalCount} users
        </Text>
        <Table
          {...tableProps}
          columns={columns}
          rowKey="id"
          scroll={{ x: 1000 }}
          size="middle"
          onRow={(record) => ({
            style: { cursor: "pointer" },
            onClick: (e) => {
              const target = e.target as HTMLElement;
              const isAction =
                target.closest("button") ||
                target.closest(".ant-popover") ||
                target.closest(".ant-popconfirm");
              if (!isAction) {
                handleViewUser(record.id);
              }
            },
          })}
        />
      </Card>

      <UserDetail
        userId={selectedUserId}
        open={detailOpen}
        onClose={() => {
          setDetailOpen(false);
          setSelectedUserId(null);
        }}
        onUserDeleted={handleUserDeleted}
      />

      <CreateUserModal
        open={createOpen}
        onClose={() => setCreateOpen(false)}
        onSuccess={handleCreateSuccess}
      />
    </div>
  );
};
