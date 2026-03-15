import React from "react";
import {
  Modal,
  Form,
  Input,
  Select,
  DatePicker,
  Tag,
  message,
} from "antd";
import { useCustomMutation } from "@refinedev/core";
import {
  API_BASE_URL,
  API_ADMIN_PREFIX,
  TASK_PRIORITY_OPTIONS,
  BRAND_COLORS,
} from "../../utils/constants";
import type { AssignTaskInput } from "../../types";

interface AssignTaskModalProps {
  readonly open: boolean;
  readonly onClose: () => void;
  readonly userId: string;
  readonly userName: string;
  readonly onSuccess: () => void;
}

export const AssignTaskModal: React.FC<AssignTaskModalProps> = ({
  open,
  onClose,
  userId,
  userName,
  onSuccess,
}) => {
  const [form] = Form.useForm<AssignTaskInput>();
  const { mutate: assignTask, isPending: isLoading } = useCustomMutation();

  const handleSubmit = () => {
    form
      .validateFields()
      .then((values) => {
        const payload = {
          ...values,
          dueDate: values.dueDate
            ? (values.dueDate as unknown as { toISOString: () => string }).toISOString()
            : undefined,
        };

        assignTask(
          {
            url: `${API_BASE_URL}${API_ADMIN_PREFIX}/users/${userId}/tasks`,
            method: "post",
            values: payload,
          },
          {
            onSuccess: () => {
              message.success(`Task assigned to ${userName}`);
              form.resetFields();
              onSuccess();
              onClose();
            },
            onError: (error) => {
              message.error(
                error?.message ?? "Failed to assign task",
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
      title={`Assign Task to ${userName || "User"}`}
      open={open}
      onOk={handleSubmit}
      onCancel={handleCancel}
      confirmLoading={isLoading}
      okText="Assign Task"
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
        initialValues={{ priority: "none" }}
        style={{ marginTop: 16 }}
      >
        <Form.Item
          name="title"
          label="Task Title"
          rules={[{ required: true, message: "Title is required" }]}
        >
          <Input placeholder="Enter task title" />
        </Form.Item>

        <Form.Item name="description" label="Description">
          <Input.TextArea
            placeholder="Optional description..."
            rows={3}
            showCount
            maxLength={500}
          />
        </Form.Item>

        <Form.Item name="priority" label="Priority">
          <Select
            options={TASK_PRIORITY_OPTIONS.map((p) => ({
              value: p.value,
              label: (
                <Tag color={p.color} style={{ margin: 0 }}>
                  {p.label}
                </Tag>
              ),
            }))}
          />
        </Form.Item>

        <Form.Item name="dueDate" label="Due Date">
          <DatePicker
            style={{ width: "100%" }}
            showTime
            format="YYYY-MM-DD HH:mm"
            placeholder="Select due date (optional)"
          />
        </Form.Item>
      </Form>
    </Modal>
  );
};
