import React, { useEffect, useState } from "react";
import {
  Drawer,
  Tabs,
  Typography,
  Space,
  Tag,
  Button,
  Spin,
  Empty,
  Form,
  Table,
  message,
} from "antd";
import {
  UserOutlined,
  PlusOutlined,
} from "@ant-design/icons";
import { useOne, useUpdate, useCustom } from "@refinedev/core";
import { StatusBadge } from "../../components/common/StatusBadge";
import { formatDate, formatDateTime, priorityColor } from "../../utils/formatters";
import { API_BASE_URL, API_ADMIN_PREFIX } from "../../utils/constants";
import { UserProfileTab } from "./UserProfileTab";
import { ResetPasswordModal } from "./ResetPasswordModal";
import { DeleteUserModal } from "./DeleteUserModal";
import { AssignTaskModal } from "./AssignTaskModal";
import type { UserRecord, PlanType, TaskSummary, AuditLogRecord } from "../../types";

const { Text } = Typography;

interface UserDetailProps {
  readonly userId: string | null;
  readonly open: boolean;
  readonly onClose: () => void;
  readonly onUserDeleted?: () => void;
}

export const UserDetail: React.FC<UserDetailProps> = ({
  userId,
  open,
  onClose,
  onUserDeleted,
}) => {
  const [form] = Form.useForm();
  const [isDirty, setIsDirty] = useState(false);
  const [resetPasswordOpen, setResetPasswordOpen] = useState(false);
  const [deleteUserOpen, setDeleteUserOpen] = useState(false);
  const [assignTaskOpen, setAssignTaskOpen] = useState(false);
  const [activeTab, setActiveTab] = useState("profile");

  const { data, isLoading, refetch } = useOne<UserRecord>({
    resource: "users",
    id: userId ?? "",
    queryOptions: { enabled: !!userId } as never,
  });

  const { mutate: updateUser, isPending: isSaving } = useUpdate();

  const { data: tasksData, isLoading: tasksLoading, refetch: refetchTasks } =
    useCustom<TaskSummary[]>({
      url: `${API_BASE_URL}${API_ADMIN_PREFIX}/users/${userId}/tasks`,
      method: "get",
      queryOptions: {
        enabled: !!userId && activeTab === "tasks",
      } as never,
    });

  const { data: activityData, isLoading: activityLoading } =
    useCustom<AuditLogRecord[]>({
      url: `${API_BASE_URL}${API_ADMIN_PREFIX}/users/${userId}/activity`,
      method: "get",
      config: { query: { limit: 50 } },
      queryOptions: {
        enabled: !!userId && activeTab === "activity",
      } as never,
    });

  const user = data?.data;

  useEffect(() => {
    if (user && open) {
      form.setFieldsValue({
        name: user.name ?? "",
        email: user.email ?? "",
        timezone: user.timezone ?? "Asia/Kolkata",
        avatarUrl: user.avatarUrl ?? "",
      });
      setIsDirty(false);
    }
  }, [user, open, form]);

  useEffect(() => {
    if (!open) {
      setActiveTab("profile");
      setIsDirty(false);
    }
  }, [open]);

  const handleSave = () => {
    form.validateFields().then((values) => {
      if (!userId) return;
      updateUser(
        {
          resource: "users",
          id: userId,
          values: {
            name: values.name,
            email: values.email,
            timezone: values.timezone,
            avatarUrl: values.avatarUrl || undefined,
          },
        },
        {
          onSuccess: () => {
            message.success("User updated successfully");
            setIsDirty(false);
            refetch();
          },
          onError: (error) => {
            message.error(error?.message ?? "Failed to update user");
          },
        },
      );
    });
  };

  const handleRoleChange = (newRole: string) => {
    if (!userId) return;
    updateUser(
      {
        resource: "users",
        id: userId,
        values: { adminRole: newRole },
      },
      {
        onSuccess: () => {
          message.success(`Role changed`);
          refetch();
        },
        onError: (error) => {
          message.error(error?.message ?? "Failed to change role");
        },
      },
    );
  };

  const handlePlanChange = (plan: PlanType) => {
    if (!userId) return;
    updateUser(
      {
        resource: "users",
        id: userId,
        values: { planOverride: plan },
      },
      {
        onSuccess: () => {
          message.success(`Plan changed to ${plan}`);
          refetch();
        },
      },
    );
  };

  const handleBanToggle = () => {
    if (!userId || !user) return;
    updateUser(
      {
        resource: "users",
        id: userId,
        values: { isBanned: !user.isBanned },
      },
      {
        onSuccess: () => {
          message.success(user.isBanned ? "User unbanned" : "User banned");
          refetch();
        },
      },
    );
  };

  const handleDeleteSuccess = () => {
    onClose();
    onUserDeleted?.();
  };

  const taskColumns = [
    {
      title: "Title",
      dataIndex: "title",
      key: "title",
      ellipsis: true,
    },
    {
      title: "Status",
      dataIndex: "status",
      key: "status",
      width: 100,
      render: (status: string) => <StatusBadge status={status} />,
    },
    {
      title: "Priority",
      dataIndex: "priority",
      key: "priority",
      width: 90,
      render: (priority: string) => (
        <Tag color={priorityColor(priority)}>
          {(priority ?? "none").toUpperCase()}
        </Tag>
      ),
    },
    {
      title: "Due Date",
      dataIndex: "dueDate",
      key: "dueDate",
      width: 110,
      render: (date: string | null) => (date ? formatDate(date) : "--"),
    },
    {
      title: "Created",
      dataIndex: "createdAt",
      key: "createdAt",
      width: 110,
      render: (date: string) => formatDate(date),
    },
  ];

  const tasks: TaskSummary[] = Array.isArray(tasksData?.data)
    ? tasksData.data
    : [];

  const renderTasks = () => (
    <div>
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          marginBottom: 16,
        }}
      >
        <Text type="secondary">
          {tasks.length > 0
            ? `${tasks.length} task${tasks.length !== 1 ? "s" : ""}`
            : ""}
        </Text>
        <Button
          type="primary"
          icon={<PlusOutlined />}
          size="small"
          onClick={() => setAssignTaskOpen(true)}
          style={{
            backgroundColor: "#FFD700",
            borderColor: "#FFD700",
            color: "#0F0A1A",
            fontWeight: 600,
          }}
        >
          Assign Task
        </Button>
      </div>
      {tasks.length === 0 && !tasksLoading ? (
        <Empty description="No tasks yet" />
      ) : (
        <Table
          dataSource={tasks}
          columns={taskColumns}
          rowKey="id"
          size="small"
          loading={tasksLoading}
          pagination={{ pageSize: 10 }}
          scroll={{ x: 500 }}
        />
      )}
    </div>
  );

  return (
    <>
      <Drawer
        title={
          <Space>
            <UserOutlined />
            <span>User Detail</span>
          </Space>
        }
        open={open}
        onClose={onClose}
        width={620}
      >
        {isLoading ? (
          <div style={{ textAlign: "center", padding: 40 }}>
            <Spin size="large" />
          </div>
        ) : !user ? (
          <Empty description="User not found" />
        ) : (
          <Tabs
            activeKey={activeTab}
            onChange={setActiveTab}
            items={[
              {
                key: "profile",
                label: "Profile",
                children: (
                  <UserProfileTab
                    user={user}
                    form={form}
                    isDirty={isDirty}
                    isSaving={isSaving}
                    onValuesChange={() => setIsDirty(true)}
                    onSave={handleSave}
                    onRoleChange={handleRoleChange}
                    onPlanChange={handlePlanChange}
                    onBanToggle={handleBanToggle}
                    onResetPassword={() => setResetPasswordOpen(true)}
                    onDeleteUser={() => setDeleteUserOpen(true)}
                  />
                ),
              },
              {
                key: "tasks",
                label: "Tasks",
                children: renderTasks(),
              },
              {
                key: "activity",
                label: "Activity",
                children: (() => {
                  const activities: AuditLogRecord[] = Array.isArray(activityData?.data)
                    ? activityData.data
                    : [];
                  return activities.length === 0 && !activityLoading ? (
                    <Empty description="No activity recorded" style={{ marginTop: 40 }} />
                  ) : (
                    <Table
                      dataSource={activities}
                      rowKey="id"
                      size="small"
                      loading={activityLoading}
                      pagination={{ pageSize: 15 }}
                      scroll={{ x: 500 }}
                      columns={[
                        {
                          title: "Time",
                          dataIndex: "createdAt",
                          key: "createdAt",
                          width: 160,
                          render: (date: string) => formatDateTime(date),
                        },
                        {
                          title: "Action",
                          dataIndex: "action",
                          key: "action",
                          width: 140,
                          render: (action: string) => <Tag color="purple">{action}</Tag>,
                        },
                        {
                          title: "Resource",
                          key: "resource",
                          width: 130,
                          render: (_: unknown, record: AuditLogRecord) => (
                            <Space size={4}>
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
                              return (
                                <Text style={{ fontSize: 12 }}>
                                  {JSON.stringify(JSON.parse(metadata)).slice(0, 60)}
                                </Text>
                              );
                            } catch {
                              return <Text style={{ fontSize: 12 }}>{metadata.slice(0, 60)}</Text>;
                            }
                          },
                        },
                      ]}
                    />
                  );
                })(),
              },
            ]}
          />
        )}
      </Drawer>

      {user && userId && (
        <>
          <ResetPasswordModal
            open={resetPasswordOpen}
            onClose={() => setResetPasswordOpen(false)}
            userId={userId}
            userName={user.name}
            userEmail={user.email}
          />
          <DeleteUserModal
            open={deleteUserOpen}
            onClose={() => setDeleteUserOpen(false)}
            userId={userId}
            userName={user.name}
            userEmail={user.email}
            onSuccess={handleDeleteSuccess}
          />
          <AssignTaskModal
            open={assignTaskOpen}
            onClose={() => setAssignTaskOpen(false)}
            userId={userId}
            userName={user.name}
            onSuccess={() => refetchTasks()}
          />
        </>
      )}
    </>
  );
};
