import React, { useState } from "react";
import {
  Card,
  Typography,
  Calendar,
  Badge,
  Select,
  Row,
  Col,
  Button,
  List,
  Tag,
  Empty,
  Space,
} from "antd";
import { ArrowLeftOutlined } from "@ant-design/icons";
import { useList, useNavigation } from "@refinedev/core";
import dayjs, { type Dayjs } from "dayjs";
import { categoryLabel } from "../../utils/formatters";
import { CONTENT_CATEGORIES } from "../../utils/constants";
import type { ContentRecord } from "../../types";

const { Title, Text } = Typography;

export const ContentCalendar: React.FC = () => {
  const { push } = useNavigation();
  const [selectedDate, setSelectedDate] = useState<Dayjs>(dayjs());
  const [selectedCategory, setSelectedCategory] = useState<string | undefined>();

  const { data: contentData, isLoading } = useList<ContentRecord>({
    resource: "content",
    pagination: { pageSize: 100 },
    filters: selectedCategory
      ? [{ field: "category", operator: "eq", value: selectedCategory }]
      : [],
  });

  const contentItems = contentData?.data ?? [];

  // Group content by date
  const contentByDate: Record<string, ContentRecord[]> = {};
  for (const item of contentItems) {
    const date = dayjs(item.scheduledAt ?? item.createdAt).format("YYYY-MM-DD");
    if (!contentByDate[date]) {
      contentByDate[date] = [];
    }
    contentByDate[date].push(item);
  }

  const dateCellRender = (value: Dayjs) => {
    const dateStr = value.format("YYYY-MM-DD");
    const items = contentByDate[dateStr] ?? [];

    if (items.length === 0) return null;

    return (
      <ul style={{ listStyle: "none", padding: 0, margin: 0 }}>
        {items.slice(0, 3).map((item) => (
          <li key={item.id} style={{ marginBottom: 2 }}>
            <Badge
              status={item.isActive ? "success" : "default"}
              text={
                <Text style={{ fontSize: 11 }}>
                  {categoryLabel(item.category)}
                </Text>
              }
            />
          </li>
        ))}
        {items.length > 3 && (
          <li>
            <Text type="secondary" style={{ fontSize: 11 }}>
              +{items.length - 3} more
            </Text>
          </li>
        )}
      </ul>
    );
  };

  const selectedDateStr = selectedDate.format("YYYY-MM-DD");
  const selectedItems = contentByDate[selectedDateStr] ?? [];

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
          Content Calendar
        </Title>
      </Space>

      <Row gutter={[16, 16]}>
        <Col xs={24} lg={16}>
          <Card bordered={false}>
            <Row
              justify="space-between"
              align="middle"
              style={{ marginBottom: 16 }}
            >
              <Col>
                <Select
                  placeholder="All Categories"
                  allowClear
                  style={{ width: 200 }}
                  value={selectedCategory}
                  onChange={setSelectedCategory}
                  options={CONTENT_CATEGORIES.map((c) => ({
                    value: c.value,
                    label: c.label,
                  }))}
                />
              </Col>
            </Row>
            <Calendar
              fullscreen={true}
              onSelect={setSelectedDate}
              cellRender={(current, info) => {
                if (info.type === "date") {
                  return dateCellRender(current as Dayjs);
                }
                return null;
              }}
            />
          </Card>
        </Col>

        <Col xs={24} lg={8}>
          <Card
            title={`Content for ${selectedDate.format("MMM D, YYYY")}`}
            bordered={false}
          >
            {selectedItems.length === 0 ? (
              <Empty
                description="No content scheduled"
                image={Empty.PRESENTED_IMAGE_SIMPLE}
              />
            ) : (
              <List
                dataSource={selectedItems}
                renderItem={(item) => (
                  <List.Item>
                    <List.Item.Meta
                      title={
                        <Space>
                          <Tag color="purple">
                            {categoryLabel(item.category)}
                          </Tag>
                          <Badge
                            status={item.isActive ? "success" : "default"}
                            text={item.isActive ? "Active" : "Inactive"}
                          />
                        </Space>
                      }
                      description={
                        <div>
                          <Text style={{ fontSize: 13 }}>
                            {item.content.slice(0, 120)}
                            {item.content.length > 120 ? "..." : ""}
                          </Text>
                          {item.author && (
                            <div style={{ marginTop: 4 }}>
                              <Text type="secondary" style={{ fontSize: 12 }}>
                                -- {item.author}
                              </Text>
                            </div>
                          )}
                        </div>
                      }
                    />
                  </List.Item>
                )}
              />
            )}
          </Card>
        </Col>
      </Row>
    </div>
  );
};
