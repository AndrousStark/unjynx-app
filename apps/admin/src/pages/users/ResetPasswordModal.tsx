import React from "react";
import {
  Modal,
  Form,
  Input,
  Alert,
  Typography,
  Avatar,
  Space,
  message,
} from "antd";
import { UserOutlined } from "@ant-design/icons";
import { useCustomMutation } from "@refinedev/core";
import { API_BASE_URL, API_ADMIN_PREFIX, BRAND_COLORS } from "../../utils/constants";

const { Text } = Typography;

interface ResetPasswordModalProps {
  readonly open: boolean;
  readonly onClose: () => void;
  readonly userId: string;
  readonly userName: string;
  readonly userEmail: string;
}

export const ResetPasswordModal: React.FC<ResetPasswordModalProps> = ({
  open,
  onClose,
  userId,
  userName,
  userEmail,
}) => {
  const [form] = Form.useForm<{
    newPassword: string;
    confirmPassword: string;
  }>();
  const { mutate: resetPassword, isPending: isLoading } = useCustomMutation();

  const handleSubmit = () => {
    form
      .validateFields()
      .then((values) => {
        resetPassword(
          {
            url: `${API_BASE_URL}${API_ADMIN_PREFIX}/users/${userId}/reset-password`,
            method: "post",
            values: { newPassword: values.newPassword },
          },
          {
            onSuccess: () => {
              message.success("Password reset successfully");
              form.resetFields();
              onClose();
            },
            onError: (error) => {
              message.error(
                error?.message ?? "Failed to reset password",
              );
            },
          },
        );
      })
      .catch(() => {
        // Validation errors shown inline
      });
  };

  const handleCancel = () => {
    form.resetFields();
    onClose();
  };

  return (
    <Modal
      title="Reset User Password"
      open={open}
      onOk={handleSubmit}
      onCancel={handleCancel}
      confirmLoading={isLoading}
      okText="Reset Password"
      okButtonProps={{
        style: {
          backgroundColor: BRAND_COLORS.error,
          borderColor: BRAND_COLORS.error,
          color: BRAND_COLORS.white,
          fontWeight: 600,
        },
      }}
      width={480}
      destroyOnClose
    >
      <Space
        direction="vertical"
        size="middle"
        style={{ width: "100%", marginTop: 12 }}
      >
        <Space align="center" size="middle">
          <Avatar size={48} icon={<UserOutlined />} />
          <div>
            <Text strong style={{ fontSize: 15, display: "block" }}>
              {userName || "Unknown"}
            </Text>
            <Text type="secondary" style={{ fontSize: 13 }}>
              {userEmail}
            </Text>
          </div>
        </Space>

        <Alert
          type="warning"
          showIcon
          message="This will immediately change the user's password."
          description="The user will need to sign in with the new password. Any existing sessions will remain active until they expire."
        />

        <Form form={form} layout="vertical">
          <Form.Item
            name="newPassword"
            label="New Password"
            rules={[
              { required: true, message: "New password is required" },
              { min: 8, message: "Password must be at least 8 characters" },
            ]}
          >
            <Input.Password
              placeholder="Minimum 8 characters"
              autoComplete="new-password"
            />
          </Form.Item>

          <Form.Item
            name="confirmPassword"
            label="Confirm New Password"
            dependencies={["newPassword"]}
            rules={[
              { required: true, message: "Please confirm the password" },
              ({ getFieldValue }) => ({
                validator(_, value) {
                  if (!value || getFieldValue("newPassword") === value) {
                    return Promise.resolve();
                  }
                  return Promise.reject(
                    new Error("Passwords do not match"),
                  );
                },
              }),
            ]}
          >
            <Input.Password
              placeholder="Re-enter new password"
              autoComplete="new-password"
            />
          </Form.Item>
        </Form>
      </Space>
    </Modal>
  );
};
