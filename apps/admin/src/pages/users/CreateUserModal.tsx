import React from "react";
import {
  Modal,
  Form,
  Input,
  Select,
  Tag,
  message,
} from "antd";
import { useCreate } from "@refinedev/core";
import {
  ADMIN_ROLE_OPTIONS,
  TIMEZONE_OPTIONS,
  BRAND_COLORS,
} from "../../utils/constants";
import type { CreateUserInput } from "../../types";

interface CreateUserModalProps {
  readonly open: boolean;
  readonly onClose: () => void;
  readonly onSuccess: () => void;
}

export const CreateUserModal: React.FC<CreateUserModalProps> = ({
  open,
  onClose,
  onSuccess,
}) => {
  const [form] = Form.useForm<CreateUserInput & { confirmPassword: string }>();
  const { mutate: createUser, isPending: isLoading } = useCreate();

  const handleSubmit = () => {
    form
      .validateFields()
      .then((values) => {
        const { confirmPassword: _confirm, ...payload } = values;
        createUser(
          {
            resource: "users",
            values: payload,
          },
          {
            onSuccess: () => {
              message.success("User created successfully");
              form.resetFields();
              onSuccess();
              onClose();
            },
            onError: (error) => {
              message.error(
                error?.message ?? "Failed to create user",
              );
            },
          },
        );
      })
      .catch(() => {
        // Validation errors are shown inline
      });
  };

  const handleCancel = () => {
    form.resetFields();
    onClose();
  };

  return (
    <Modal
      title="Create New User"
      open={open}
      onOk={handleSubmit}
      onCancel={handleCancel}
      confirmLoading={isLoading}
      okText="Create User"
      okButtonProps={{
        style: {
          backgroundColor: BRAND_COLORS.gold,
          borderColor: BRAND_COLORS.gold,
          color: BRAND_COLORS.midnight,
          fontWeight: 600,
        },
      }}
      width={520}
      destroyOnClose
    >
      <Form
        form={form}
        layout="vertical"
        initialValues={{
          timezone: "Asia/Kolkata",
          adminRole: "user",
        }}
        style={{ marginTop: 16 }}
      >
        <Form.Item
          name="email"
          label="Email"
          rules={[
            { required: true, message: "Email is required" },
            { type: "email", message: "Enter a valid email address" },
          ]}
        >
          <Input placeholder="user@example.com" autoComplete="off" />
        </Form.Item>

        <Form.Item
          name="password"
          label="Password"
          rules={[
            { required: true, message: "Password is required" },
            { min: 8, message: "Password must be at least 8 characters" },
          ]}
        >
          <Input.Password placeholder="Minimum 8 characters" autoComplete="new-password" />
        </Form.Item>

        <Form.Item
          name="confirmPassword"
          label="Confirm Password"
          dependencies={["password"]}
          rules={[
            { required: true, message: "Please confirm the password" },
            ({ getFieldValue }) => ({
              validator(_, value) {
                if (!value || getFieldValue("password") === value) {
                  return Promise.resolve();
                }
                return Promise.reject(
                  new Error("Passwords do not match"),
                );
              },
            }),
          ]}
        >
          <Input.Password placeholder="Re-enter password" autoComplete="new-password" />
        </Form.Item>

        <Form.Item name="name" label="Name">
          <Input placeholder="Full name (optional)" />
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

        <Form.Item name="adminRole" label="Role">
          <Select
            options={ADMIN_ROLE_OPTIONS.map((r) => ({
              value: r.value,
              label: (
                <Tag color={r.color} style={{ margin: 0 }}>
                  {r.label}
                </Tag>
              ),
            }))}
          />
        </Form.Item>
      </Form>
    </Modal>
  );
};
