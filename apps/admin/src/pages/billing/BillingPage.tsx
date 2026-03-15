import React, { useState, useCallback } from "react";
import {
  Typography,
  Card,
  Table,
  Tag,
  Select,
  Row,
  Col,
  Button,
  Space,
  Modal,
  Form,
  Input,
  InputNumber,
  DatePicker,
  Switch,
  message,
  Popconfirm,
  Tabs,
  Statistic,
  Spin,
} from "antd";
import {
  PlusOutlined,
  DollarOutlined,
  DeleteOutlined,
  EditOutlined,
} from "@ant-design/icons";
import { useCustom } from "@refinedev/core";
import { StatusBadge } from "../../components/common/StatusBadge";
import {
  formatDate,
  formatCurrency,
  formatNumber,
  planColor,
} from "../../utils/formatters";
import { API_BASE_URL, API_ADMIN_PREFIX, PLAN_OPTIONS, BRAND_COLORS } from "../../utils/constants";
import { getAccessToken } from "../../providers/auth-provider";
import type { PlanType } from "../../types";

const { Title, Text } = Typography;

interface Subscription {
  id: string;
  userId: string;
  plan: string;
  status: string;
  currentPeriodStart: string | null;
  currentPeriodEnd: string | null;
  cancelledAt: string | null;
  createdAt: string;
}

interface CouponData {
  id: string;
  code: string;
  discountPercent: number;
  maxUses: number;
  usedCount: number;
  validUntil: string | null;
  isActive: boolean;
  createdAt: string;
}

interface BillingStats {
  totalSubscribers: number;
  activeSubscribers: number;
  mrr: number;
  cancelledThisMonth: number;
}

interface CouponFormValues {
  code: string;
  discountPercent: number;
  maxUses: number;
  expiresAt?: { toISOString(): string };
}

export const BillingPage: React.FC = () => {
  const [couponModalOpen, setCouponModalOpen] = useState(false);
  const [couponForm] = Form.useForm();
  const [planFilter, setPlanFilter] = useState<string | undefined>();
  const [statusFilter, setStatusFilter] = useState<string | undefined>();
  const [subPage, setSubPage] = useState(1);

  const { data: statsData, isLoading: statsLoading } = useCustom<BillingStats>({
    url: `${API_BASE_URL}${API_ADMIN_PREFIX}/billing/stats`,
    method: "get",
  });

  const { data: subsData, isLoading: subsLoading } = useCustom<Subscription[]>({
    url: `${API_BASE_URL}${API_ADMIN_PREFIX}/billing/subscriptions`,
    method: "get",
    config: {
      query: {
        page: subPage,
        limit: 20,
        ...(planFilter ? { plan: planFilter } : {}),
        ...(statusFilter ? { status: statusFilter } : {}),
      },
    },
  });

  const { data: couponsData, refetch: refetchCoupons } = useCustom<CouponData[]>({
    url: `${API_BASE_URL}${API_ADMIN_PREFIX}/billing/coupons`,
    method: "get",
  });

  const stats = statsData?.data as unknown as BillingStats | undefined;
  const subs = (subsData?.data as unknown as Subscription[]) ?? [];
  const subTotal = (subsData as unknown as { data?: { meta?: { total?: number } } })?.data?.meta?.total ?? subs.length;
  const couponsList = (couponsData?.data as unknown as CouponData[]) ?? [];

  const handleCreateCoupon = useCallback(
    async (values: CouponFormValues) => {
      try {
        const token = getAccessToken();
        const res = await fetch(
          `${API_BASE_URL}${API_ADMIN_PREFIX}/billing/coupons`,
          {
            method: "POST",
            headers: {
              Authorization: `Bearer ${token}`,
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              code: values.code,
              discountPercent: values.discountPercent,
              maxUses: values.maxUses,
              validUntil: values.expiresAt?.toISOString(),
            }),
          },
        );

        if (res.ok) {
          message.success(`Coupon ${values.code} created`);
          setCouponModalOpen(false);
          couponForm.resetFields();
          refetchCoupons();
        } else {
          const body = await res.json().catch(() => ({}));
          message.error(body.error ?? "Failed to create coupon");
        }
      } catch {
        message.error("Network error");
      }
    },
    [couponForm, refetchCoupons],
  );

  const handleDeleteCoupon = useCallback(
    async (id: string) => {
      try {
        const token = getAccessToken();
        const res = await fetch(
          `${API_BASE_URL}${API_ADMIN_PREFIX}/billing/coupons/${id}`,
          {
            method: "DELETE",
            headers: { Authorization: `Bearer ${token}` },
          },
        );

        if (res.ok) {
          message.success("Coupon deleted");
          refetchCoupons();
        } else {
          message.error("Failed to delete coupon");
        }
      } catch {
        message.error("Network error");
      }
    },
    [refetchCoupons],
  );

  const handleToggleCoupon = useCallback(
    async (id: string, isActive: boolean) => {
      try {
        const token = getAccessToken();
        const res = await fetch(
          `${API_BASE_URL}${API_ADMIN_PREFIX}/billing/coupons/${id}`,
          {
            method: "PATCH",
            headers: {
              Authorization: `Bearer ${token}`,
              "Content-Type": "application/json",
            },
            body: JSON.stringify({ isActive }),
          },
        );

        if (res.ok) {
          message.success(isActive ? "Coupon activated" : "Coupon deactivated");
          refetchCoupons();
        } else {
          message.error("Failed to update coupon");
        }
      } catch {
        message.error("Network error");
      }
    },
    [refetchCoupons],
  );

  const subscriptionColumns = [
    {
      title: "User ID",
      dataIndex: "userId",
      key: "userId",
      render: (id: string) => <Text code>{id.slice(0, 12)}...</Text>,
    },
    {
      title: "Plan",
      dataIndex: "plan",
      key: "plan",
      width: 100,
      render: (plan: PlanType) => (
        <Tag color={planColor(plan)}>{plan.toUpperCase()}</Tag>
      ),
    },
    {
      title: "Status",
      dataIndex: "status",
      key: "status",
      width: 110,
      render: (status: string) => <StatusBadge status={status} />,
    },
    {
      title: "Period End",
      dataIndex: "currentPeriodEnd",
      key: "currentPeriodEnd",
      width: 120,
      render: (date: string | null) => (date ? formatDate(date) : "-"),
    },
    {
      title: "Cancelled",
      dataIndex: "cancelledAt",
      key: "cancelledAt",
      width: 120,
      render: (date: string | null) => (date ? formatDate(date) : "-"),
    },
    {
      title: "Created",
      dataIndex: "createdAt",
      key: "createdAt",
      width: 120,
      render: (date: string) => formatDate(date),
    },
  ];

  const couponColumns = [
    {
      title: "Code",
      dataIndex: "code",
      key: "code",
      render: (code: string) => <Text code copyable>{code}</Text>,
    },
    {
      title: "Discount",
      dataIndex: "discountPercent",
      key: "discountPercent",
      width: 100,
      render: (pct: number) => <Tag color="green">{pct}% OFF</Tag>,
    },
    {
      title: "Usage",
      key: "usage",
      width: 120,
      render: (_: unknown, record: CouponData) => (
        <Text>
          {record.usedCount} / {record.maxUses}
        </Text>
      ),
    },
    {
      title: "Expires",
      dataIndex: "validUntil",
      key: "validUntil",
      width: 120,
      render: (date: string | null) => (date ? formatDate(date) : "Never"),
    },
    {
      title: "Active",
      dataIndex: "isActive",
      key: "isActive",
      width: 80,
      render: (isActive: boolean, record: CouponData) => (
        <Switch
          checked={isActive}
          size="small"
          onChange={(checked) => handleToggleCoupon(record.id, checked)}
        />
      ),
    },
    {
      title: "Actions",
      key: "actions",
      width: 80,
      render: (_: unknown, record: CouponData) => (
        <Popconfirm title="Delete coupon?" onConfirm={() => handleDeleteCoupon(record.id)}>
          <Button type="text" icon={<DeleteOutlined />} danger size="small" />
        </Popconfirm>
      ),
    },
  ];

  if (statsLoading) {
    return (
      <div style={{ textAlign: "center", padding: 80 }}>
        <Spin size="large" />
      </div>
    );
  }

  return (
    <div>
      <Title level={3} style={{ marginBottom: 24 }}>
        Billing
      </Title>

      {/* Summary Stats */}
      <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
        <Col xs={24} sm={6}>
          <Card bordered={false}>
            <Statistic
              title="Active Subscriptions"
              value={stats?.activeSubscribers ?? 0}
              valueStyle={{ color: BRAND_COLORS.violet }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={6}>
          <Card bordered={false}>
            <Statistic
              title="MRR"
              value={(stats?.mrr ?? 0) / 100}
              prefix="$"
              precision={2}
              valueStyle={{ color: BRAND_COLORS.success }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={6}>
          <Card bordered={false}>
            <Statistic
              title="Total Subscribers"
              value={stats?.totalSubscribers ?? 0}
            />
          </Card>
        </Col>
        <Col xs={24} sm={6}>
          <Card bordered={false}>
            <Statistic
              title="Churn (this month)"
              value={stats?.cancelledThisMonth ?? 0}
              valueStyle={{ color: stats?.cancelledThisMonth ? BRAND_COLORS.error : undefined }}
            />
          </Card>
        </Col>
      </Row>

      <Tabs
        defaultActiveKey="subscriptions"
        items={[
          {
            key: "subscriptions",
            label: "Subscriptions",
            children: (
              <div>
                <Card bordered={false} style={{ marginBottom: 16 }}>
                  <Row gutter={16}>
                    <Col xs={12} sm={6}>
                      <Select
                        placeholder="Filter by Plan"
                        allowClear
                        style={{ width: "100%" }}
                        value={planFilter}
                        onChange={(v) => {
                          setPlanFilter(v);
                          setSubPage(1);
                        }}
                        options={PLAN_OPTIONS.map((p) => ({
                          value: p.value,
                          label: p.label,
                        }))}
                      />
                    </Col>
                    <Col xs={12} sm={6}>
                      <Select
                        placeholder="Filter by Status"
                        allowClear
                        style={{ width: "100%" }}
                        value={statusFilter}
                        onChange={(v) => {
                          setStatusFilter(v);
                          setSubPage(1);
                        }}
                        options={[
                          { value: "active", label: "Active" },
                          { value: "cancelled", label: "Cancelled" },
                          { value: "past_due", label: "Past Due" },
                          { value: "expired", label: "Expired" },
                        ]}
                      />
                    </Col>
                  </Row>
                </Card>

                <Card bordered={false}>
                  <Table
                    dataSource={subs}
                    columns={subscriptionColumns}
                    rowKey="id"
                    scroll={{ x: 800 }}
                    size="middle"
                    loading={subsLoading}
                    pagination={{
                      current: subPage,
                      pageSize: 20,
                      total: subTotal,
                      onChange: (p) => setSubPage(p),
                    }}
                  />
                </Card>
              </div>
            ),
          },
          {
            key: "coupons",
            label: `Coupons (${couponsList.length})`,
            children: (
              <div>
                <Row justify="end" style={{ marginBottom: 16 }}>
                  <Button
                    type="primary"
                    icon={<PlusOutlined />}
                    onClick={() => setCouponModalOpen(true)}
                  >
                    New Coupon
                  </Button>
                </Row>

                <Card bordered={false}>
                  <Table
                    dataSource={couponsList}
                    columns={couponColumns}
                    rowKey="id"
                    size="middle"
                    pagination={false}
                  />
                </Card>
              </div>
            ),
          },
        ]}
      />

      {/* Coupon Modal */}
      <Modal
        title="Create Coupon"
        open={couponModalOpen}
        onCancel={() => setCouponModalOpen(false)}
        footer={null}
      >
        <Form<CouponFormValues>
          form={couponForm}
          layout="vertical"
          onFinish={handleCreateCoupon}
        >
          <Form.Item
            name="code"
            label="Coupon Code"
            rules={[
              { required: true, message: "Code is required" },
              {
                pattern: /^[A-Z0-9]+$/,
                message: "Uppercase letters and numbers only",
              },
            ]}
          >
            <Input placeholder="e.g., SUMMER30" />
          </Form.Item>

          <Form.Item
            name="discountPercent"
            label="Discount (%)"
            rules={[{ required: true, message: "Discount is required" }]}
          >
            <InputNumber min={1} max={100} style={{ width: "100%" }} />
          </Form.Item>

          <Form.Item
            name="maxUses"
            label="Max Uses"
            rules={[{ required: true, message: "Max uses is required" }]}
          >
            <InputNumber min={1} style={{ width: "100%" }} />
          </Form.Item>

          <Form.Item name="expiresAt" label="Expires At">
            <DatePicker style={{ width: "100%" }} />
          </Form.Item>

          <Form.Item>
            <Button type="primary" htmlType="submit" block>
              Create Coupon
            </Button>
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
};
