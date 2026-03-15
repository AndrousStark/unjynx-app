import React from "react";
import {
  Avatar,
  Typography,
  Space,
  Tag,
  Button,
  Form,
  Input,
  Select,
  Card,
  Popconfirm,
  Divider,
} from "antd";
import {
  UserOutlined,
  LockOutlined,
  DeleteOutlined,
  SaveOutlined,
} from "@ant-design/icons";
import { StatusBadge } from "../../components/common/StatusBadge";
import {
  formatDateTime,
  planColor,
  adminRoleColor,
  adminRoleLabel,
} from "../../utils/formatters";
import {
  PLAN_OPTIONS,
  TIMEZONE_OPTIONS,
  ADMIN_ROLE_OPTIONS,
} from "../../utils/constants";
import type { UserRecord, PlanType } from "../../types";
import type { FormInstance } from "antd";

const { Title, Text } = Typography;

interface UserProfileTabProps {
  readonly user: UserRecord;
  readonly form: FormInstance;
  readonly isDirty: boolean;
  readonly isSaving: boolean;
  readonly onValuesChange: () => void;
  readonly onSave: () => void;
  readonly onRoleChange: (role: string) => void;
  readonly onPlanChange: (plan: PlanType) => void;
  readonly onBanToggle: () => void;
  readonly onResetPassword: () => void;
  readonly onDeleteUser: () => void;
}

export const UserProfileTab: React.FC<UserProfileTabProps> = ({
  user,
  form,
  isDirty,
  isSaving,
  onValuesChange,
  onSave,
  onRoleChange,
  onPlanChange,
  onBanToggle,
  onResetPassword,
  onDeleteUser,
}) => {
  return (
    <div>
      {/* Header */}
      <div style={{ textAlign: "center", marginBottom: 24 }}>
        <Avatar
          size={80}
          src={user.avatarUrl}
          icon={!user.avatarUrl ? <UserOutlined /> : undefined}
        />
        <Title level={4} style={{ marginTop: 12, marginBottom: 4 }}>
          {user.name || "Unknown"}
        </Title>
        <Text type="secondary">{user.email}</Text>
        <div style={{ marginTop: 8 }}>
          <StatusBadge status={user.isBanned ? "banned" : "active"} />
        </div>
      </div>

      {/* Editable Form */}
      <Form
        form={form}
        layout="vertical"
        onValuesChange={onValuesChange}
        style={{ marginBottom: 24 }}
      >
        <Form.Item
          name="name"
          label="Name"
          rules={[{ required: true, message: "Name is required" }]}
        >
          <Input placeholder="Full name" />
        </Form.Item>
        <Form.Item
          name="email"
          label="Email"
          rules={[
            { required: true, message: "Email is required" },
            { type: "email", message: "Enter a valid email" },
          ]}
        >
          <Input placeholder="Email address" />
        </Form.Item>
        <Form.Item name="timezone" label="Timezone">
          <Select
            options={TIMEZONE_OPTIONS.map((tz) => ({
              value: tz.value,
              label: tz.label,
            }))}
            showSearch
            optionFilterProp="label"
          />
        </Form.Item>
        <Form.Item name="avatarUrl" label="Avatar URL">
          <Input placeholder="https://..." />
        </Form.Item>
      </Form>

      {isDirty && (
        <Button
          type="primary"
          icon={<SaveOutlined />}
          onClick={onSave}
          loading={isSaving}
          block
          style={{
            marginBottom: 24,
            backgroundColor: "#6C5CE7",
            borderColor: "#6C5CE7",
          }}
        >
          Save Changes
        </Button>
      )}

      {/* Role & Plan */}
      <Divider orientation="left" plain>
        Role &amp; Plan
      </Divider>

      <Space direction="vertical" size="middle" style={{ width: "100%" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <Text type="secondary">Role</Text>
          <Space>
            <Tag color={adminRoleColor(user.adminRole ?? "user")}>
              {adminRoleLabel(user.adminRole ?? "user")}
            </Tag>
            <Popconfirm
              title="Change user role"
              description={
                <Select
                  defaultValue={user.adminRole ?? "user"}
                  onChange={onRoleChange}
                  style={{ width: 180 }}
                  options={ADMIN_ROLE_OPTIONS.map((r) => ({
                    value: r.value,
                    label: r.label,
                  }))}
                />
              }
              okButtonProps={{ style: { display: "none" } }}
              cancelText="Close"
            >
              <Button type="link" size="small">
                Change
              </Button>
            </Popconfirm>
          </Space>
        </div>

        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <Text type="secondary">Plan</Text>
          <Select
            value={user.plan ?? "free"}
            onChange={onPlanChange}
            style={{ width: 140 }}
            options={PLAN_OPTIONS.map((p) => ({
              value: p.value,
              label: (
                <Tag color={planColor(p.value)} style={{ margin: 0 }}>
                  {p.label}
                </Tag>
              ),
            }))}
          />
        </div>

        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <Text type="secondary">Status</Text>
          <Popconfirm
            title={user.isBanned ? "Unban this user?" : "Ban this user?"}
            onConfirm={onBanToggle}
          >
            <Button size="small" danger={!user.isBanned}>
              {user.isBanned ? "Unban" : "Ban"}
            </Button>
          </Popconfirm>
        </div>
      </Space>

      {/* Metadata */}
      <Divider orientation="left" plain>
        Metadata
      </Divider>

      <Space direction="vertical" size="small" style={{ width: "100%" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <Text type="secondary">ID</Text>
          <Text code copyable style={{ fontSize: 12 }}>
            {user.id}
          </Text>
        </div>
        {user.logtoId && (
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <Text type="secondary">Logto ID</Text>
            <Text code copyable style={{ fontSize: 12 }}>
              {user.logtoId}
            </Text>
          </div>
        )}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <Text type="secondary">Created</Text>
          <Text style={{ fontSize: 13 }}>
            {user.createdAt ? formatDateTime(user.createdAt) : "--"}
          </Text>
        </div>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <Text type="secondary">Last Active</Text>
          <Text style={{ fontSize: 13 }}>
            {user.updatedAt ? formatDateTime(user.updatedAt) : "--"}
          </Text>
        </div>
      </Space>

      {/* Danger Zone */}
      <Divider />
      <Card
        size="small"
        title={
          <Text strong style={{ color: "#FF4D4F" }}>
            Danger Zone
          </Text>
        }
        style={{ borderColor: "#FF4D4F40", background: "transparent" }}
      >
        <Space direction="vertical" size="middle" style={{ width: "100%" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <div>
              <Text strong style={{ display: "block" }}>Reset Password</Text>
              <Text type="secondary" style={{ fontSize: 12 }}>
                Force a password change for this user
              </Text>
            </div>
            <Button
              icon={<LockOutlined />}
              onClick={onResetPassword}
              style={{ borderColor: "#FAAD14", color: "#FAAD14" }}
            >
              Reset
            </Button>
          </div>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <div>
              <Text strong style={{ display: "block" }}>Delete User</Text>
              <Text type="secondary" style={{ fontSize: 12 }}>
                Permanently remove this user and all data
              </Text>
            </div>
            <Button
              icon={<DeleteOutlined />}
              danger
              onClick={onDeleteUser}
            >
              Delete
            </Button>
          </div>
        </Space>
      </Card>
    </div>
  );
};
