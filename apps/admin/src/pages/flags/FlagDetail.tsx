import React, { useEffect } from "react";
import {
  Drawer,
  Form,
  Input,
  Select,
  Slider,
  Button,
  Space,
  Spin,
  Typography,
  Descriptions,
  message,
} from "antd";
import { SaveOutlined, FlagOutlined } from "@ant-design/icons";
import { useOne, useCreate, useUpdate } from "@refinedev/core";
import { formatDateTime } from "../../utils/formatters";
import { FLAG_TYPES } from "../../utils/constants";
import type { FeatureFlagRecord, FlagType } from "../../types";

const { Text } = Typography;
const { TextArea } = Input;

interface FlagDetailProps {
  readonly flagId: string | null;
  readonly open: boolean;
  readonly isCreate: boolean;
  readonly onClose: () => void;
}

interface FlagFormValues {
  readonly key: string;
  readonly name: string;
  readonly description?: string;
  readonly status: string;
  readonly percentage: number;
}

export const FlagDetail: React.FC<FlagDetailProps> = ({
  flagId,
  open,
  isCreate,
  onClose,
}) => {
  const [form] = Form.useForm();

  const { data, isLoading } = useOne<FeatureFlagRecord>({
    resource: "feature-flags",
    id: flagId ?? "",
    queryOptions: { enabled: !!flagId && !isCreate } as never,
  });

  const { mutate: createFlag, isPending: isCreating } = useCreate();
  const { mutate: updateFlag, isPending: isUpdating } = useUpdate();

  const flag = data?.data;

  useEffect(() => {
    if (isCreate) {
      form.resetFields();
    } else if (flag) {
      form.setFieldsValue({
        key: flag.key,
        name: flag.name,
        description: flag.description,
        status: flag.status,
        percentage: flag.percentage,
      });
    }
  }, [flag, isCreate, form]);

  const handleSubmit = (values: FlagFormValues) => {
    if (isCreate) {
      createFlag(
        { resource: "feature-flags", values },
        {
          onSuccess: () => {
            message.success("Flag created");
            onClose();
          },
        },
      );
    } else if (flagId) {
      updateFlag(
        {
          resource: "feature-flags",
          id: flagId,
          values: {
            name: values.name,
            description: values.description,
            status: values.status,
            percentage: values.percentage,
          },
        },
        {
          onSuccess: () => {
            message.success("Flag updated");
            onClose();
          },
        },
      );
    }
  };

  return (
    <Drawer
      title={
        <Space>
          <FlagOutlined />
          <span>{isCreate ? "Create Feature Flag" : "Edit Feature Flag"}</span>
        </Space>
      }
      open={open}
      onClose={onClose}
      width={500}
    >
      {isLoading && !isCreate ? (
        <div style={{ textAlign: "center", padding: 40 }}>
          <Spin size="large" />
        </div>
      ) : (
        <Form<FlagFormValues>
          form={form}
          layout="vertical"
          onFinish={handleSubmit}
          initialValues={{
            status: "disabled",
            percentage: 0,
          }}
        >
          <Form.Item
            name="key"
            label="Key"
            rules={[
              { required: true, message: "Key is required" },
              {
                pattern: /^[a-z0-9_-]+$/,
                message: "Lowercase alphanumeric, hyphens, underscores only",
              },
            ]}
          >
            <Input
              placeholder="e.g., enable-ai-chat"
              disabled={!isCreate}
            />
          </Form.Item>

          <Form.Item
            name="name"
            label="Name"
            rules={[{ required: true, message: "Name is required" }]}
          >
            <Input placeholder="e.g., AI Chat Feature" />
          </Form.Item>

          <Form.Item name="description" label="Description">
            <TextArea
              rows={3}
              placeholder="What does this flag control?"
            />
          </Form.Item>

          <Form.Item
            name="status"
            label="Status"
            rules={[{ required: true }]}
          >
            <Select
              options={[
                { value: "enabled", label: "Enabled (all users)" },
                { value: "disabled", label: "Disabled" },
                { value: "percentage", label: "Percentage Rollout" },
                { value: "user_list", label: "User List" },
              ]}
            />
          </Form.Item>

          <Form.Item
            noStyle
            shouldUpdate={(prev, cur) => prev.status !== cur.status}
          >
            {({ getFieldValue }) =>
              getFieldValue("status") === "percentage" ? (
                <Form.Item
                  name="percentage"
                  label="Rollout Percentage"
                >
                  <Slider
                    min={0}
                    max={100}
                    marks={{ 0: "0%", 25: "25%", 50: "50%", 75: "75%", 100: "100%" }}
                    tooltip={{ formatter: (val) => `${val}%` }}
                  />
                </Form.Item>
              ) : null
            }
          </Form.Item>

          {!isCreate && flag && (
            <Descriptions
              column={1}
              size="small"
              bordered
              style={{ marginBottom: 24 }}
            >
              <Descriptions.Item label="Created">
                {formatDateTime(flag.createdAt)}
              </Descriptions.Item>
              <Descriptions.Item label="Updated">
                {formatDateTime(flag.updatedAt)}
              </Descriptions.Item>
            </Descriptions>
          )}

          <Form.Item>
            <Button
              type="primary"
              htmlType="submit"
              icon={<SaveOutlined />}
              loading={isCreating || isUpdating}
              block
            >
              {isCreate ? "Create Flag" : "Save Changes"}
            </Button>
          </Form.Item>
        </Form>
      )}
    </Drawer>
  );
};
