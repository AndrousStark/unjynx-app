// ============================================================
// UNJYNX Dev Portal - Component Tests
// ============================================================

import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { ConfigProvider, theme } from "antd";
import { MemoryRouter } from "react-router-dom";

// Wrap components in required providers
const TestWrapper: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <ConfigProvider theme={{ algorithm: theme.darkAlgorithm }}>
    <MemoryRouter>{children}</MemoryRouter>
  </ConfigProvider>
);

// --- StatusIndicator ---
import { StatusIndicator } from "@/components/common/StatusIndicator";

describe("StatusIndicator", () => {
  it("renders with healthy status", () => {
    render(
      <TestWrapper>
        <StatusIndicator status="healthy" />
      </TestWrapper>
    );
    expect(screen.getByTestId("status-indicator")).toBeInTheDocument();
    expect(screen.getByText("Healthy")).toBeInTheDocument();
  });

  it("renders with down status", () => {
    render(
      <TestWrapper>
        <StatusIndicator status="down" />
      </TestWrapper>
    );
    expect(screen.getByText("Down")).toBeInTheDocument();
  });

  it("renders custom label", () => {
    render(
      <TestWrapper>
        <StatusIndicator status="healthy" label="API Online" />
      </TestWrapper>
    );
    expect(screen.getByText("API Online")).toBeInTheDocument();
  });

  it("hides label when showLabel is false", () => {
    render(
      <TestWrapper>
        <StatusIndicator status="healthy" showLabel={false} />
      </TestWrapper>
    );
    expect(screen.queryByText("Healthy")).not.toBeInTheDocument();
  });
});

// --- GrafanaEmbed ---
import { GrafanaEmbed } from "@/components/common/GrafanaEmbed";

describe("GrafanaEmbed", () => {
  it("renders placeholder when using localhost", () => {
    render(
      <TestWrapper>
        <GrafanaEmbed dashboardUid="test-dashboard" title="Test Dashboard" />
      </TestWrapper>
    );
    expect(screen.getByTestId("grafana-embed")).toBeInTheDocument();
    expect(screen.getByText(/test-dashboard/)).toBeInTheDocument();
  });

  it("shows panel ID in placeholder", () => {
    render(
      <TestWrapper>
        <GrafanaEmbed dashboardUid="test-dash" panelId={42} />
      </TestWrapper>
    );
    expect(screen.getByText(/42/)).toBeInTheDocument();
  });
});

// --- CodeBlock ---
import { CodeBlock } from "@/components/common/CodeBlock";

describe("CodeBlock", () => {
  it("renders code content", () => {
    render(
      <TestWrapper>
        <CodeBlock code="SELECT * FROM tasks;" language="sql" />
      </TestWrapper>
    );
    expect(screen.getByTestId("code-block")).toBeInTheDocument();
    expect(screen.getByText("SELECT * FROM tasks;")).toBeInTheDocument();
  });

  it("shows language label", () => {
    render(
      <TestWrapper>
        <CodeBlock code="const x = 1;" language="typescript" />
      </TestWrapper>
    );
    expect(screen.getByText("typescript")).toBeInTheDocument();
  });

  it("shows copy button by default", () => {
    render(
      <TestWrapper>
        <CodeBlock code="test" />
      </TestWrapper>
    );
    expect(screen.getByText("Copy")).toBeInTheDocument();
  });

  it("hides copy button when showCopy is false", () => {
    render(
      <TestWrapper>
        <CodeBlock code="test" showCopy={false} />
      </TestWrapper>
    );
    expect(screen.queryByText("Copy")).not.toBeInTheDocument();
  });
});

// --- JsonViewer ---
import { JsonViewer } from "@/components/common/JsonViewer";

describe("JsonViewer", () => {
  it("renders JSON data", () => {
    render(
      <TestWrapper>
        <JsonViewer data={{ name: "test", value: 42 }} title="Test JSON" />
      </TestWrapper>
    );
    expect(screen.getByTestId("json-viewer")).toBeInTheDocument();
    expect(screen.getByText("Test JSON")).toBeInTheDocument();
  });

  it("renders arrays", () => {
    const { container } = render(
      <TestWrapper>
        <JsonViewer data={[1, 2, 3]} />
      </TestWrapper>
    );
    expect(container.querySelector("pre")).toBeInTheDocument();
  });
});

// --- ServiceCard ---
import { ServiceCard } from "@/components/charts/ServiceCard";

describe("ServiceCard", () => {
  it("renders with title and metrics", () => {
    render(
      <TestWrapper>
        <ServiceCard
          title="API Server"
          status="healthy"
          metrics={[
            { label: "Uptime", value: "99.9%" },
            { label: "RPS", value: 142 },
          ]}
        />
      </TestWrapper>
    );
    expect(screen.getByTestId("service-card")).toBeInTheDocument();
    expect(screen.getByText("API Server")).toBeInTheDocument();
  });
});

// --- MetricPanel ---
import { MetricPanel } from "@/components/charts/MetricPanel";

describe("MetricPanel", () => {
  it("renders title and value", () => {
    render(
      <TestWrapper>
        <MetricPanel title="Total RPS" value={142} suffix="req/s" />
      </TestWrapper>
    );
    expect(screen.getByTestId("metric-panel")).toBeInTheDocument();
    expect(screen.getByText("Total RPS")).toBeInTheDocument();
  });

  it("renders with description", () => {
    render(
      <TestWrapper>
        <MetricPanel title="Active Alerts" value={3} description="unresolved" />
      </TestWrapper>
    );
    expect(screen.getByText("unresolved")).toBeInTheDocument();
  });
});

// --- TimeSeriesChart ---
import { TimeSeriesChart } from "@/components/charts/TimeSeriesChart";

describe("TimeSeriesChart", () => {
  it("renders with title", () => {
    render(
      <TestWrapper>
        <TimeSeriesChart
          title="Test Chart"
          data={[
            { time: "00:00", value: 10 },
            { time: "01:00", value: 20 },
          ]}
          series={[{ dataKey: "value", name: "Test" }]}
        />
      </TestWrapper>
    );
    expect(screen.getByTestId("time-series-chart")).toBeInTheDocument();
    expect(screen.getByText("Test Chart")).toBeInTheDocument();
  });
});

// --- SchemaViewer ---
import { SchemaViewer } from "@/components/schema/SchemaViewer";

describe("SchemaViewer", () => {
  const mockTables = [
    {
      name: "tasks",
      rowCount: 100,
      sizeKB: 512,
      columns: [
        { name: "id", type: "uuid", nullable: false, defaultValue: "gen_random_uuid()", isPrimaryKey: true, isForeignKey: false, references: null },
        { name: "title", type: "varchar", nullable: false, defaultValue: null, isPrimaryKey: false, isForeignKey: false, references: null },
      ],
      indexes: [
        { name: "tasks_pkey", columns: ["id"], unique: true, type: "btree" },
      ],
    },
  ];

  it("renders table list", () => {
    render(
      <TestWrapper>
        <SchemaViewer tables={mockTables} />
      </TestWrapper>
    );
    expect(screen.getByTestId("schema-viewer")).toBeInTheDocument();
    expect(screen.getByText("tasks")).toBeInTheDocument();
  });

  it("shows row count", () => {
    render(
      <TestWrapper>
        <SchemaViewer tables={mockTables} />
      </TestWrapper>
    );
    expect(screen.getByText("100 rows")).toBeInTheDocument();
  });

  it("shows empty state message when no table selected", () => {
    render(
      <TestWrapper>
        <SchemaViewer tables={mockTables} />
      </TestWrapper>
    );
    expect(
      screen.getByText("Select a table to view its schema")
    ).toBeInTheDocument();
  });
});
