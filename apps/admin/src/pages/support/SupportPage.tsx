import React, { useState, useCallback } from "react";
import {
  Typography,
  Card,
  Input,
  Button,
  Row,
  Col,
  Descriptions,
  Tag,
  Space,
  Avatar,
  message,
  Empty,
  Alert,
  Popconfirm,
  Statistic,
  Spin,
} from "antd";
import {
  SearchOutlined,
  UserOutlined,
  SyncOutlined,
  MailOutlined,
  LockOutlined,
  CheckCircleOutlined,
  WarningOutlined,
  CloseCircleOutlined,
} from "@ant-design/icons";
import { formatDateTime, formatNumber } from "../../utils/formatters";
import { API_BASE_URL, API_ADMIN_PREFIX, BRAND_COLORS } from "../../utils/constants";
import { getAccessToken } from "../../providers/auth-provider";

const { Title, Text } = Typography;

interface UserRecord {
  id: string;
  name: string | null;
  email: string | null;
  avatarUrl: string | null;
  adminRole: string | null;
  createdAt: string;
  updatedAt: string;
}

interface AccountHealth {
  userId: string;
  email: string | null;
  name: string | null;
  createdAt: string;
  lastActive: string;
  totalTasks: number;
  completedTasks: number;
  subscriptionPlan: string | null;
  subscriptionStatus: string | null;
  totalNotifications: number;
  failedNotifications: number;
}

export const SupportPage: React.FC = () => {
  const [searchValue, setSearchValue] = useState("");
  const [searchedUser, setSearchedUser] = useState<UserRecord | null>(null);
  const [isSearching, setIsSearching] = useState(false);
  const [health, setHealth] = useState<AccountHealth | null>(null);
  const [healthLoading, setHealthLoading] = useState(false);

  const handleSearch = useCallback(async () => {
    if (!searchValue.trim()) {
      message.warning("Enter an email, name, or user ID");
      return;
    }

    setIsSearching(true);
    try {
      const token = getAccessToken();
      const response = await fetch(
        `${API_BASE_URL}${API_ADMIN_PREFIX}/users?search=${encodeURIComponent(searchValue)}&limit=1`,
        {
          headers: { Authorization: `Bearer ${token}` },
        },
      );
      const json = await response.json();

      if (json.success && json.data?.length > 0) {
        const user = json.data[0];
        setSearchedUser(user);

        // Fetch real account health
        setHealthLoading(true);
        try {
          const healthRes = await fetch(
            `${API_BASE_URL}${API_ADMIN_PREFIX}/support/account-health/${user.id}`,
            {
              headers: { Authorization: `Bearer ${token}` },
            },
          );
          const healthJson = await healthRes.json();
          if (healthJson.success && healthJson.data) {
            setHealth(healthJson.data);
          }
        } catch {
          // health fetch failed, continue with user data
        } finally {
          setHealthLoading(false);
        }
      } else {
        setSearchedUser(null);
        setHealth(null);
        message.info("No user found");
      }
    } catch {
      message.error("Search failed");
    } finally {
      setIsSearching(false);
    }
  }, [searchValue]);

  const handleResetPassword = useCallback(async () => {
    if (!searchedUser) return;
    // Navigate to user detail for password reset
    message.info("Use the User Management page to reset passwords via Logto");
  }, [searchedUser]);

  const completionRate =
    health && health.totalTasks > 0
      ? Math.round((health.completedTasks / health.totalTasks) * 100)
      : 0;

  return (
    <div>
      <Title level={3} style={{ marginBottom: 24 }}>
        Support
      </Title>

      {/* Search */}
      <Card bordered={false} style={{ marginBottom: 24 }}>
        <Title level={5} style={{ marginBottom: 16 }}>
          User Lookup
        </Title>
        <Row gutter={16}>
          <Col flex="auto">
            <Input
              prefix={<SearchOutlined />}
              placeholder="Search by email, name, or user ID..."
              value={searchValue}
              onChange={(e) => setSearchValue(e.target.value)}
              onPressEnter={handleSearch}
              size="large"
            />
          </Col>
          <Col>
            <Button
              type="primary"
              onClick={handleSearch}
              loading={isSearching}
              size="large"
            >
              Search
            </Button>
          </Col>
        </Row>
      </Card>

      {searchedUser && (
        <Row gutter={[16, 16]}>
          {/* User Profile */}
          <Col xs={24} lg={12}>
            <Card bordered={false}>
              <Space
                direction="vertical"
                align="center"
                style={{ width: "100%", marginBottom: 24 }}
              >
                <Avatar
                  size={64}
                  src={searchedUser.avatarUrl}
                  icon={!searchedUser.avatarUrl ? <UserOutlined /> : undefined}
                  style={{ backgroundColor: BRAND_COLORS.violet }}
                />
                <Title level={4} style={{ margin: 0 }}>
                  {searchedUser.name ?? "Unnamed"}
                </Title>
                <Text type="secondary">{searchedUser.email}</Text>
              </Space>

              <Descriptions column={1} bordered size="small">
                <Descriptions.Item label="User ID">
                  <Text code copyable>
                    {searchedUser.id}
                  </Text>
                </Descriptions.Item>
                <Descriptions.Item label="Role">
                  <Tag color="blue">
                    {(searchedUser.adminRole ?? "user").toUpperCase()}
                  </Tag>
                </Descriptions.Item>
                <Descriptions.Item label="Signed Up">
                  {formatDateTime(searchedUser.createdAt)}
                </Descriptions.Item>
                <Descriptions.Item label="Last Active">
                  {formatDateTime(searchedUser.updatedAt)}
                </Descriptions.Item>
              </Descriptions>
            </Card>
          </Col>

          {/* Account Health & Actions */}
          <Col xs={24} lg={12}>
            {healthLoading ? (
              <Card bordered={false} style={{ textAlign: "center", padding: 40 }}>
                <Spin />
              </Card>
            ) : health ? (
              <Card bordered={false} style={{ marginBottom: 16 }}>
                <Title level={5}>Account Health</Title>
                <Row gutter={[16, 16]}>
                  <Col xs={12}>
                    <Statistic
                      title="Total Tasks"
                      value={health.totalTasks}
                    />
                  </Col>
                  <Col xs={12}>
                    <Statistic
                      title="Completed"
                      value={health.completedTasks}
                      suffix={`(${completionRate}%)`}
                      valueStyle={{ color: BRAND_COLORS.success }}
                    />
                  </Col>
                  <Col xs={12}>
                    <Statistic
                      title="Subscription"
                      value={(health.subscriptionPlan ?? "free").toUpperCase()}
                      valueStyle={{ fontSize: 16 }}
                    />
                  </Col>
                  <Col xs={12}>
                    <Statistic
                      title="Sub Status"
                      value={(health.subscriptionStatus ?? "none").toUpperCase()}
                      valueStyle={{
                        fontSize: 16,
                        color:
                          health.subscriptionStatus === "active"
                            ? BRAND_COLORS.success
                            : BRAND_COLORS.warning,
                      }}
                    />
                  </Col>
                  <Col xs={12}>
                    <Statistic
                      title="Notifications"
                      value={health.totalNotifications}
                    />
                  </Col>
                  <Col xs={12}>
                    <Statistic
                      title="Failed Notifs"
                      value={health.failedNotifications}
                      valueStyle={{
                        color: health.failedNotifications > 0 ? BRAND_COLORS.error : undefined,
                      }}
                    />
                  </Col>
                </Row>
              </Card>
            ) : null}

            <Card bordered={false}>
              <Title level={5}>Quick Actions</Title>
              <Space direction="vertical" style={{ width: "100%" }}>
                <Popconfirm
                  title="Send password reset email?"
                  onConfirm={handleResetPassword}
                >
                  <Button icon={<LockOutlined />} block danger>
                    Reset Password
                  </Button>
                </Popconfirm>
              </Space>
            </Card>

            <Card bordered={false} style={{ marginTop: 16 }}>
              <Title level={5}>Last Active</Title>
              <Text>
                {health
                  ? formatDateTime(health.lastActive)
                  : formatDateTime(searchedUser.updatedAt)}
              </Text>
            </Card>
          </Col>
        </Row>
      )}

      {!searchedUser && !isSearching && (
        <Card bordered={false}>
          <Empty
            description="Search for a user to view their support details"
            image={Empty.PRESENTED_IMAGE_SIMPLE}
          />
        </Card>
      )}
    </div>
  );
};
