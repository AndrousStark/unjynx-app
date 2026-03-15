import React from "react";
import { Card, Button, Space, Typography } from "antd";
import {
  PlusOutlined,
  SendOutlined,
  ReloadOutlined,
  DownloadOutlined,
} from "@ant-design/icons";
import { useNavigate } from "react-router-dom";

const { Title } = Typography;

interface QuickAction {
  readonly label: string;
  readonly icon: React.ReactNode;
  readonly onClick: () => void;
  readonly type?: "primary" | "default" | "dashed";
}

interface QuickActionsProps {
  readonly title?: string;
  readonly actions?: readonly QuickAction[];
}

const DEFAULT_ACTIONS: readonly QuickAction[] = [];

export const QuickActions: React.FC<QuickActionsProps> = ({
  title = "Quick Actions",
  actions,
}) => {
  const navigate = useNavigate();

  const defaultActions: readonly QuickAction[] = [
    {
      label: "New Content",
      icon: <PlusOutlined />,
      onClick: () => navigate("/content/create"),
      type: "primary",
    },
    {
      label: "Broadcast",
      icon: <SendOutlined />,
      onClick: () => navigate("/notifications"),
    },
    {
      label: "Refresh Data",
      icon: <ReloadOutlined />,
      onClick: () => window.location.reload(),
    },
    {
      label: "Export Report",
      icon: <DownloadOutlined />,
      onClick: () => {
        // placeholder for report export
      },
    },
  ];

  const displayActions = actions ?? defaultActions;

  return (
    <Card bordered={false}>
      <Title level={5} style={{ marginBottom: 16 }}>
        {title}
      </Title>
      <Space wrap>
        {displayActions.map((action) => (
          <Button
            key={action.label}
            icon={action.icon}
            type={action.type ?? "default"}
            onClick={action.onClick}
          >
            {action.label}
          </Button>
        ))}
      </Space>
    </Card>
  );
};
