// ============================================================
// UNJYNX Dev Portal - Schema Viewer Component
// ============================================================

import { Table, Tag, Typography, Input, Space, Badge } from "antd";
import {
  KeyOutlined,
  LinkOutlined,
  SearchOutlined,
} from "@ant-design/icons";
import { useState, useMemo } from "react";
import type { TableColumn, TableIndex, TableSchema } from "@/types";
import { COLORS } from "@/utils/constants";
import { formatNumber } from "@/utils/formatters";

interface SchemaViewerProps {
  readonly tables: ReadonlyArray<TableSchema>;
  readonly loading?: boolean;
}

const typeColorMap: Record<string, string> = {
  uuid: "#6C5CE7",
  text: "#10B981",
  varchar: "#10B981",
  integer: "#3B82F6",
  bigint: "#3B82F6",
  numeric: "#3B82F6",
  boolean: "#F59E0B",
  timestamp: "#EF4444",
  timestamptz: "#EF4444",
  jsonb: "#FFD700",
  json: "#FFD700",
  "character varying": "#10B981",
};

const getTypeColor = (type: string): string =>
  typeColorMap[type.toLowerCase()] ?? "#9CA3AF";

export const SchemaViewer: React.FC<SchemaViewerProps> = ({
  tables,
  loading = false,
}) => {
  const [selectedTable, setSelectedTable] = useState<string | null>(null);
  const [search, setSearch] = useState("");

  const filteredTables = useMemo(
    () =>
      tables.filter((t) =>
        t.name.toLowerCase().includes(search.toLowerCase())
      ),
    [tables, search]
  );

  const activeTable = useMemo(
    () => tables.find((t) => t.name === selectedTable),
    [tables, selectedTable]
  );

  const columnDefs = [
    {
      title: "Column",
      dataIndex: "name",
      key: "name",
      render: (name: string, record: TableColumn) => (
        <Space>
          {record.isPrimaryKey && (
            <KeyOutlined style={{ color: COLORS.gold }} />
          )}
          {record.isForeignKey && (
            <LinkOutlined style={{ color: COLORS.violet }} />
          )}
          <Typography.Text
            code
            style={{ fontFamily: "'JetBrains Mono', monospace" }}
          >
            {name}
          </Typography.Text>
        </Space>
      ),
    },
    {
      title: "Type",
      dataIndex: "type",
      key: "type",
      render: (type: string) => (
        <Tag
          color={getTypeColor(type)}
          style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 12 }}
        >
          {type}
        </Tag>
      ),
    },
    {
      title: "Nullable",
      dataIndex: "nullable",
      key: "nullable",
      render: (v: boolean) => (
        <Tag color={v ? "warning" : "success"}>{v ? "YES" : "NO"}</Tag>
      ),
      width: 90,
    },
    {
      title: "Default",
      dataIndex: "defaultValue",
      key: "defaultValue",
      render: (v: string | null) =>
        v ? (
          <Typography.Text
            code
            style={{ fontSize: 12, fontFamily: "'JetBrains Mono', monospace" }}
          >
            {v}
          </Typography.Text>
        ) : (
          <Typography.Text type="secondary">-</Typography.Text>
        ),
    },
    {
      title: "References",
      dataIndex: "references",
      key: "references",
      render: (v: string | null) =>
        v ? (
          <Tag color="purple" style={{ fontSize: 12 }}>
            {v}
          </Tag>
        ) : null,
    },
  ];

  const indexDefs = [
    {
      title: "Index Name",
      dataIndex: "name",
      key: "name",
      render: (name: string) => (
        <Typography.Text code style={{ fontSize: 12 }}>
          {name}
        </Typography.Text>
      ),
    },
    {
      title: "Columns",
      dataIndex: "columns",
      key: "columns",
      render: (cols: ReadonlyArray<string>) =>
        cols.map((c) => (
          <Tag key={c} style={{ fontSize: 11 }}>
            {c}
          </Tag>
        )),
    },
    {
      title: "Unique",
      dataIndex: "unique",
      key: "unique",
      render: (v: boolean) => (v ? <Badge status="success" text="Yes" /> : "-"),
      width: 80,
    },
    {
      title: "Type",
      dataIndex: "type",
      key: "type",
      render: (v: string) => <Tag>{v}</Tag>,
      width: 100,
    },
  ];

  return (
    <div data-testid="schema-viewer" style={{ display: "flex", gap: 16, minHeight: 500 }}>
      {/* Table list sidebar */}
      <div
        style={{
          width: 280,
          flexShrink: 0,
          background: "#1A1528",
          borderRadius: 8,
          border: "1px solid #2D2640",
          overflow: "hidden",
        }}
      >
        <div style={{ padding: 12, borderBottom: "1px solid #2D2640" }}>
          <Input
            prefix={<SearchOutlined />}
            placeholder="Filter tables..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            allowClear
            size="small"
          />
        </div>
        <div style={{ maxHeight: 600, overflow: "auto" }}>
          {filteredTables.map((table) => (
            <div
              key={table.name}
              onClick={() => setSelectedTable(table.name)}
              style={{
                padding: "8px 12px",
                cursor: "pointer",
                background:
                  selectedTable === table.name ? "#2D2640" : "transparent",
                borderLeft:
                  selectedTable === table.name
                    ? `3px solid ${COLORS.violet}`
                    : "3px solid transparent",
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
              }}
              role="button"
              tabIndex={0}
              onKeyDown={(e) => {
                if (e.key === "Enter") setSelectedTable(table.name);
              }}
            >
              <Typography.Text
                code
                style={{ fontSize: 12, color: COLORS.white }}
              >
                {table.name}
              </Typography.Text>
              <Typography.Text style={{ fontSize: 11, color: "#6B7280" }}>
                {formatNumber(table.rowCount)} rows
              </Typography.Text>
            </div>
          ))}
        </div>
      </div>

      {/* Table detail */}
      <div style={{ flex: 1 }}>
        {activeTable ? (
          <Space direction="vertical" style={{ width: "100%" }} size={16}>
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
              }}
            >
              <Typography.Title level={5} style={{ margin: 0, color: COLORS.white }}>
                {activeTable.name}
              </Typography.Title>
              <Space>
                <Tag>{formatNumber(activeTable.rowCount)} rows</Tag>
                <Tag>{(activeTable.sizeKB / 1024).toFixed(2)} MB</Tag>
                <Tag>{activeTable.columns.length} columns</Tag>
                <Tag>{activeTable.indexes.length} indexes</Tag>
              </Space>
            </div>

            <Typography.Text strong style={{ color: "#9CA3AF" }}>
              Columns
            </Typography.Text>
            <Table
              dataSource={activeTable.columns as unknown as TableColumn[]}
              columns={columnDefs}
              pagination={false}
              size="small"
              rowKey="name"
              loading={loading}
            />

            {activeTable.indexes.length > 0 && (
              <>
                <Typography.Text strong style={{ color: "#9CA3AF" }}>
                  Indexes
                </Typography.Text>
                <Table
                  dataSource={activeTable.indexes as unknown as TableIndex[]}
                  columns={indexDefs}
                  pagination={false}
                  size="small"
                  rowKey="name"
                />
              </>
            )}
          </Space>
        ) : (
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              height: "100%",
              color: "#6B7280",
            }}
          >
            <Typography.Text type="secondary">
              Select a table to view its schema
            </Typography.Text>
          </div>
        )}
      </div>
    </div>
  );
};
