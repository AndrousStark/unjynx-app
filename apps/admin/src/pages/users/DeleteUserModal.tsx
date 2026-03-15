import React, { useState } from "react";
import {
  Modal,
  Input,
  Alert,
  Typography,
  Avatar,
  Space,
  message,
} from "antd";
import {
  UserOutlined,
  ExclamationCircleFilled,
} from "@ant-design/icons";
import { useDelete } from "@refinedev/core";
import { BRAND_COLORS } from "../../utils/constants";

const { Text } = Typography;

interface DeleteUserModalProps {
  readonly open: boolean;
  readonly onClose: () => void;
  readonly userId: string;
  readonly userName: string;
  readonly userEmail: string;
  readonly onSuccess: () => void;
}

export const DeleteUserModal: React.FC<DeleteUserModalProps> = ({
  open,
  onClose,
  userId,
  userName,
  userEmail,
  onSuccess,
}) => {
  const [confirmEmail, setConfirmEmail] = useState("");
  const { mutate: deleteUser, isPending: isLoading } = useDelete();

  const isConfirmed =
    confirmEmail.trim().toLowerCase() === userEmail.trim().toLowerCase();

  const handleDelete = () => {
    if (!isConfirmed) return;

    deleteUser(
      {
        resource: "users",
        id: userId,
      },
      {
        onSuccess: () => {
          message.success("User deleted successfully");
          setConfirmEmail("");
          onSuccess();
          onClose();
        },
        onError: (error) => {
          message.error(
            error?.message ?? "Failed to delete user",
          );
        },
      },
    );
  };

  const handleCancel = () => {
    setConfirmEmail("");
    onClose();
  };

  return (
    <Modal
      title={
        <Space>
          <ExclamationCircleFilled
            style={{ color: BRAND_COLORS.error, fontSize: 20 }}
          />
          <span>Delete User</span>
        </Space>
      }
      open={open}
      onOk={handleDelete}
      onCancel={handleCancel}
      confirmLoading={isLoading}
      okText="Delete User Permanently"
      okButtonProps={{
        danger: true,
        disabled: !isConfirmed,
        style: { fontWeight: 600 },
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
          type="error"
          showIcon
          message="This action is irreversible"
          description="This will permanently delete the user and all their data including tasks, notifications, and subscription. This cannot be undone."
        />

        <div>
          <Text style={{ display: "block", marginBottom: 8 }}>
            Type <Text strong code>{userEmail}</Text> to confirm:
          </Text>
          <Input
            value={confirmEmail}
            onChange={(e) => setConfirmEmail(e.target.value)}
            placeholder="Enter user email to confirm"
            status={
              confirmEmail.length > 0 && !isConfirmed
                ? "error"
                : undefined
            }
          />
        </div>
      </Space>
    </Modal>
  );
};
