import React from "react";
import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import { ConfigProvider } from "antd";
import { StatCard } from "../components/charts/StatCard";
import { StatusBadge } from "../components/common/StatusBadge";

// Wrapper component for Ant Design context
function TestWrapper({ children }: { readonly children: React.ReactNode }) {
  return <ConfigProvider>{children}</ConfigProvider>;
}

describe("StatCard", () => {
  it("should render title and value", () => {
    render(
      <TestWrapper>
        <StatCard title="Total Users" value={1500} />
      </TestWrapper>,
    );

    expect(screen.getByText("Total Users")).toBeInTheDocument();
    expect(screen.getByText("1,500")).toBeInTheDocument();
  });

  it("should render string value", () => {
    render(
      <TestWrapper>
        <StatCard title="MRR" value="$8,500" />
      </TestWrapper>,
    );

    expect(screen.getByText("MRR")).toBeInTheDocument();
    expect(screen.getByText("$8,500")).toBeInTheDocument();
  });

  it("should show positive trend", () => {
    render(
      <TestWrapper>
        <StatCard title="Users" value={100} trend={12.5} trendLabel="vs last month" />
      </TestWrapper>,
    );

    expect(screen.getByText("12.5%")).toBeInTheDocument();
    expect(screen.getByText("vs last month")).toBeInTheDocument();
  });

  it("should show negative trend", () => {
    render(
      <TestWrapper>
        <StatCard title="Churn" value={5} trend={-3.2} trendLabel="vs last month" />
      </TestWrapper>,
    );

    expect(screen.getByText("3.2%")).toBeInTheDocument();
  });
});

describe("StatusBadge", () => {
  it("should render tag variant by default", () => {
    render(
      <TestWrapper>
        <StatusBadge status="active" />
      </TestWrapper>,
    );

    expect(screen.getByText("Active")).toBeInTheDocument();
  });

  it("should convert status to readable label", () => {
    render(
      <TestWrapper>
        <StatusBadge status="past_due" />
      </TestWrapper>,
    );

    expect(screen.getByText("Past due")).toBeInTheDocument();
  });

  it("should render banned status", () => {
    render(
      <TestWrapper>
        <StatusBadge status="banned" />
      </TestWrapper>,
    );

    expect(screen.getByText("Banned")).toBeInTheDocument();
  });
});
