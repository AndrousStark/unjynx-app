import React, { useState } from "react";
import {
  Form,
  Input,
  Select,
  Button,
  Card,
  Typography,
  Space,
  Upload,
  message,
  Alert,
  Divider,
  Row,
  Col,
} from "antd";
import {
  SaveOutlined,
  ArrowLeftOutlined,
  UploadOutlined,
  ImportOutlined,
} from "@ant-design/icons";
import { useCreate, useNavigation } from "@refinedev/core";
import { CONTENT_CATEGORIES } from "../../utils/constants";
import type { ContentCategory } from "../../types";

const { Title, Text } = Typography;
const { TextArea } = Input;

interface ContentFormValues {
  readonly category: ContentCategory;
  readonly content: string;
  readonly author?: string;
  readonly source?: string;
}

interface BulkImportItem {
  readonly category: string;
  readonly content: string;
  readonly author?: string;
  readonly source?: string;
}

export const ContentCreate: React.FC = () => {
  const [form] = Form.useForm();
  const { push } = useNavigation();
  const { mutate: createContent, isPending } = useCreate();
  const { mutate: bulkImport, isPending: isBulkPending } = useCreate();
  const [bulkMode, setBulkMode] = useState(false);
  const [bulkData, setBulkData] = useState<readonly BulkImportItem[]>([]);

  const handleCreate = (values: ContentFormValues) => {
    createContent(
      {
        resource: "content",
        values,
      },
      {
        onSuccess: () => {
          message.success("Content created successfully");
          push("/content");
        },
      },
    );
  };

  const handleBulkImport = () => {
    if (bulkData.length === 0) {
      message.error("No data to import");
      return;
    }

    bulkImport(
      {
        resource: "content/bulk-import",
        values: { items: bulkData },
      },
      {
        onSuccess: () => {
          message.success(`${bulkData.length} items imported`);
          setBulkData([]);
          push("/content");
        },
      },
    );
  };

  const handleFileUpload = (file: File) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const text = e.target?.result as string;

        if (file.name.endsWith(".json")) {
          const parsed = JSON.parse(text);
          const items = Array.isArray(parsed) ? parsed : parsed.items;
          setBulkData(items);
          message.success(`${items.length} items loaded from JSON`);
        } else if (file.name.endsWith(".csv")) {
          const lines = text.split("\n").filter((l) => l.trim());
          const headers = lines[0].split(",").map((h) => h.trim());
          const items = lines.slice(1).map((line) => {
            const values = line.split(",").map((v) => v.trim());
            const item: Record<string, string> = {};
            headers.forEach((h, i) => {
              item[h] = values[i] ?? "";
            });
            return item as unknown as BulkImportItem;
          });
          setBulkData(items);
          message.success(`${items.length} items loaded from CSV`);
        } else {
          message.error("Unsupported file format. Use JSON or CSV.");
        }
      } catch {
        message.error("Failed to parse file");
      }
    };
    reader.readAsText(file);
    return false; // Prevent auto-upload
  };

  return (
    <div>
      <Space style={{ marginBottom: 24 }}>
        <Button
          icon={<ArrowLeftOutlined />}
          onClick={() => push("/content")}
        >
          Back
        </Button>
        <Title level={3} style={{ margin: 0 }}>
          {bulkMode ? "Bulk Import Content" : "Create Content"}
        </Title>
      </Space>

      <Row gutter={16} style={{ marginBottom: 16 }}>
        <Col>
          <Button
            type={!bulkMode ? "primary" : "default"}
            onClick={() => setBulkMode(false)}
          >
            Single Entry
          </Button>
        </Col>
        <Col>
          <Button
            type={bulkMode ? "primary" : "default"}
            icon={<ImportOutlined />}
            onClick={() => setBulkMode(true)}
          >
            Bulk Import
          </Button>
        </Col>
      </Row>

      {!bulkMode ? (
        <Card bordered={false}>
          <Form<ContentFormValues>
            form={form}
            layout="vertical"
            onFinish={handleCreate}
            style={{ maxWidth: 700 }}
          >
            <Form.Item
              name="category"
              label="Category"
              rules={[{ required: true, message: "Select a category" }]}
            >
              <Select
                placeholder="Select category"
                options={CONTENT_CATEGORIES.map((c) => ({
                  value: c.value,
                  label: c.label,
                }))}
              />
            </Form.Item>

            <Form.Item
              name="content"
              label="Content"
              rules={[
                { required: true, message: "Content is required" },
                { max: 5000, message: "Maximum 5000 characters" },
              ]}
            >
              <TextArea
                rows={6}
                placeholder="Enter the content text..."
                showCount
                maxLength={5000}
              />
            </Form.Item>

            <Form.Item
              name="author"
              label="Author"
              rules={[{ max: 200, message: "Maximum 200 characters" }]}
            >
              <Input placeholder="e.g., Marcus Aurelius" />
            </Form.Item>

            <Form.Item
              name="source"
              label="Source"
              rules={[{ max: 200, message: "Maximum 200 characters" }]}
            >
              <Input placeholder="e.g., Meditations, Book IV" />
            </Form.Item>

            <Form.Item>
              <Button
                type="primary"
                htmlType="submit"
                icon={<SaveOutlined />}
                loading={isPending}
              >
                Create Content
              </Button>
            </Form.Item>
          </Form>
        </Card>
      ) : (
        <Card bordered={false}>
          <Alert
            message="Bulk Import"
            description="Upload a CSV or JSON file with columns: category, content, author (optional), source (optional). Maximum 500 items per import."
            type="info"
            showIcon
            style={{ marginBottom: 24 }}
          />

          <Upload.Dragger
            accept=".csv,.json"
            beforeUpload={handleFileUpload}
            showUploadList={false}
            style={{ marginBottom: 24 }}
          >
            <p className="ant-upload-drag-icon">
              <UploadOutlined />
            </p>
            <p className="ant-upload-text">
              Click or drag CSV/JSON file to upload
            </p>
            <p className="ant-upload-hint">
              Supports single file upload. Max 500 items.
            </p>
          </Upload.Dragger>

          {bulkData.length > 0 && (
            <div>
              <Divider />
              <Text strong>{bulkData.length} items ready for import</Text>
              <div style={{ marginTop: 16 }}>
                <Button
                  type="primary"
                  icon={<ImportOutlined />}
                  onClick={handleBulkImport}
                  loading={isBulkPending}
                >
                  Import {bulkData.length} Items
                </Button>
              </div>
            </div>
          )}
        </Card>
      )}
    </div>
  );
};
