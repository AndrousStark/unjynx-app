// ============================================================
// R2 - Database Management Page
// ============================================================

import { useState, useMemo } from "react";
import {
  Typography,
  Space,
  Tabs,
  Table,
  Tag,
  Button,
  Input,
  Card,
  Popconfirm,
  InputNumber,
  Row,
  Col,
  Spin,
  Alert,
  message,
} from "antd";
import {
  DatabaseOutlined,
  HistoryOutlined,
  ThunderboltOutlined,
  CloudDownloadOutlined,
  SearchOutlined,
  ReloadOutlined,
  DownloadOutlined,
  PlayCircleOutlined,
} from "@ant-design/icons";
import { useCustom } from "@refinedev/core";
import { SchemaViewer } from "@/components/schema/SchemaViewer";
import { CodeBlock } from "@/components/common/CodeBlock";
import { MetricPanel } from "@/components/charts/MetricPanel";
import type { TableSchema, Migration, SlowQuery, DatabaseBackup } from "@/types";
import { COLORS } from "@/utils/constants";
import {
  formatDuration,
  formatTimestamp,
  formatRelativeTime,
  formatNumber,
  getStatusColor,
} from "@/utils/formatters";

// --- Backend response types ---

interface BackendTableInfo {
  readonly tableName: string;
  readonly rowCount: number;
  readonly sizeBytes: number;
  readonly columns: ReadonlyArray<{
    readonly name: string;
    readonly type: string;
    readonly nullable: boolean;
    readonly defaultValue: string | null;
  }>;
  readonly indexes: ReadonlyArray<{
    readonly name: string;
    readonly columns: string;
    readonly isUnique: boolean;
    readonly isPrimary: boolean;
  }>;
}

interface BackendSlowQuery {
  readonly query: string;
  readonly callCount: number;
  readonly totalTimeMs: number;
  readonly meanTimeMs: number;
  readonly maxTimeMs: number;
  readonly minTimeMs: number;
}

interface BackendMigration {
  readonly version: string;
  readonly name: string;
  readonly appliedAt: string;
}

interface BackendBackup {
  readonly id: string;
  readonly createdAt: string;
  readonly sizeBytes: number;
  readonly status: "completed" | "failed" | "in_progress";
  readonly verified: boolean;
  readonly lastVerifiedAt: string | null;
}

// --- Transform backend data to frontend types ---

const transformTables = (
  raw: ReadonlyArray<BackendTableInfo>
): ReadonlyArray<TableSchema> =>
  raw.map((t) => ({
    name: t.tableName,
    rowCount: t.rowCount,
    sizeKB: Math.round(t.sizeBytes / 1024),
    columns: t.columns.map((col) => {
      // Infer primary key from indexes
      const isPk = t.indexes.some(
        (idx) =>
          idx.isPrimary &&
          idx.columns.split(",").map((c) => c.trim()).includes(col.name)
      );
      // Infer foreign key from column name convention (ends with _id and not primary)
      const isFk = !isPk && col.name.endsWith("_id");
      return {
        name: col.name,
        type: col.type,
        nullable: col.nullable,
        defaultValue: col.defaultValue,
        isPrimaryKey: isPk,
        isForeignKey: isFk,
        references: null,
      };
    }),
    indexes: t.indexes.map((idx) => ({
      name: idx.name,
      columns: idx.columns.split(",").map((c) => c.trim()),
      unique: idx.isUnique,
      type: idx.isPrimary ? "btree" : "btree",
    })),
  }));

const transformMigrations = (
  raw: ReadonlyArray<BackendMigration>
): ReadonlyArray<Migration> =>
  raw.map((m, idx) => ({
    id: m.version || String(idx + 1),
    name: m.name,
    appliedAt: m.appliedAt,
    duration: 0, // Backend does not provide duration
    status: "applied" as const,
  }));

const transformSlowQueries = (
  raw: ReadonlyArray<BackendSlowQuery>
): ReadonlyArray<SlowQuery> =>
  raw.map((sq, idx) => ({
    id: `sq-${idx}`,
    query: sq.query,
    duration: Math.round(sq.meanTimeMs),
    timestamp: new Date().toISOString(), // Backend provides aggregate stats, not per-occurrence timestamps
    table: extractTableName(sq.query),
    rowsExamined: sq.callCount,
  }));

const transformBackups = (
  raw: ReadonlyArray<BackendBackup>
): ReadonlyArray<DatabaseBackup> =>
  raw.map((b) => ({
    id: b.id,
    name: `backup-${b.id}`,
    createdAt: b.createdAt,
    sizeGB: Number((b.sizeBytes / (1024 * 1024 * 1024)).toFixed(2)),
    status: b.status,
    type: "full" as const,
  }));

/**
 * Extract table name from a SQL query string (best-effort).
 */
const extractTableName = (query: string): string => {
  const fromMatch = query.match(/\bFROM\s+([a-z_][a-z0-9_]*)/i);
  if (fromMatch) return fromMatch[1];
  const intoMatch = query.match(/\bINTO\s+([a-z_][a-z0-9_]*)/i);
  if (intoMatch) return intoMatch[1];
  const updateMatch = query.match(/\bUPDATE\s+([a-z_][a-z0-9_]*)/i);
  if (updateMatch) return updateMatch[1];
  return "unknown";
};

export const DatabasePage: React.FC = () => {
  const [durationThreshold, setDurationThreshold] = useState(100);
  const [querySearch, setQuerySearch] = useState("");

  // --- Fetch schema ---
  const {
    data: schemaData,
    isLoading: schemaLoading,
    isError: schemaError,
  } = useCustom<ReadonlyArray<BackendTableInfo>>({
    url: "database/schema",
    method: "get",
    queryOptions: {
      queryKey: ["db-schema"],
    },
  });

  // --- Fetch migrations ---
  const {
    data: migrationsData,
    isLoading: migrationsLoading,
    isError: migrationsError,
  } = useCustom<ReadonlyArray<BackendMigration>>({
    url: "database/migrations",
    method: "get",
    queryOptions: {
      queryKey: ["db-migrations"],
    },
  });

  // --- Fetch slow queries ---
  const {
    data: slowQueryData,
    isLoading: sqLoading,
    isError: sqError,
    refetch: refetchSlowQueries,
  } = useCustom<ReadonlyArray<BackendSlowQuery>>({
    url: "database/slow-queries",
    method: "get",
    config: {
      query: {
        durationMs: durationThreshold,
        limit: 20,
      },
    },
    queryOptions: {
      queryKey: ["db-slow-queries", durationThreshold],
    },
  });

  // --- Fetch backups ---
  const {
    data: backupsData,
    isLoading: backupsLoading,
    isError: backupsError,
  } = useCustom<ReadonlyArray<BackendBackup>>({
    url: "database/backups",
    method: "get",
    queryOptions: {
      queryKey: ["db-backups"],
    },
  });

  // --- Transform data ---
  const tables: ReadonlyArray<TableSchema> = useMemo(
    () => (schemaData?.data ? transformTables(schemaData.data as unknown as ReadonlyArray<BackendTableInfo>) : []),
    [schemaData]
  );

  const migrations: ReadonlyArray<Migration> = useMemo(
    () => (migrationsData?.data ? transformMigrations(migrationsData.data as unknown as ReadonlyArray<BackendMigration>) : []),
    [migrationsData]
  );

  const slowQueries: ReadonlyArray<SlowQuery> = useMemo(
    () => (slowQueryData?.data ? transformSlowQueries(slowQueryData.data as unknown as ReadonlyArray<BackendSlowQuery>) : []),
    [slowQueryData]
  );

  const backups: ReadonlyArray<DatabaseBackup> = useMemo(
    () => (backupsData?.data ? transformBackups(backupsData.data as unknown as ReadonlyArray<BackendBackup>) : []),
    [backupsData]
  );

  // --- Filter slow queries by search ---
  const filteredQueries = useMemo(
    () =>
      slowQueries.filter(
        (q) =>
          querySearch === "" ||
          q.query.toLowerCase().includes(querySearch.toLowerCase())
      ),
    [slowQueries, querySearch]
  );

  const handleTriggerBackup = () => {
    message.info("Manual backup trigger is not yet implemented on the backend");
  };

  const tabItems = [
    {
      key: "schema",
      label: (
        <span>
          <DatabaseOutlined /> Schema
        </span>
      ),
      children: (
        <Spin spinning={schemaLoading}>
          {schemaError && (
            <Alert
              type="error"
              message="Failed to load database schema"
              showIcon
              style={{ marginBottom: 16 }}
            />
          )}
          <Space direction="vertical" size={16} style={{ width: "100%" }}>
            <Row gutter={[16, 16]}>
              <Col xs={12} sm={6}>
                <MetricPanel title="Tables" value={tables.length} />
              </Col>
              <Col xs={12} sm={6}>
                <MetricPanel
                  title="Total Rows"
                  value={formatNumber(tables.reduce((sum, t) => sum + t.rowCount, 0))}
                />
              </Col>
              <Col xs={12} sm={6}>
                <MetricPanel
                  title="Total Size"
                  value={`${(tables.reduce((sum, t) => sum + t.sizeKB, 0) / 1024).toFixed(1)}`}
                  suffix="MB"
                />
              </Col>
              <Col xs={12} sm={6}>
                <MetricPanel
                  title="Indexes"
                  value={tables.reduce((sum, t) => sum + t.indexes.length, 0)}
                />
              </Col>
            </Row>
            <SchemaViewer tables={tables} loading={schemaLoading} />
          </Space>
        </Spin>
      ),
    },
    {
      key: "migrations",
      label: (
        <span>
          <HistoryOutlined /> Migrations
        </span>
      ),
      children: (
        <Spin spinning={migrationsLoading}>
          {migrationsError && (
            <Alert
              type="error"
              message="Failed to load migrations"
              showIcon
              style={{ marginBottom: 16 }}
            />
          )}
          <Table
            dataSource={[...migrations].reverse() as Migration[]}
            rowKey="id"
            pagination={false}
            columns={[
              { title: "ID", dataIndex: "id", width: 80 },
              {
                title: "Migration",
                dataIndex: "name",
                render: (v: string) => (
                  <Typography.Text code style={{ fontSize: 12 }}>
                    {v}
                  </Typography.Text>
                ),
              },
              {
                title: "Applied At",
                dataIndex: "appliedAt",
                render: (v: string) => formatTimestamp(v),
                width: 180,
              },
              {
                title: "Duration",
                dataIndex: "duration",
                render: (v: number) => (v > 0 ? formatDuration(v) : "--"),
                width: 100,
              },
              {
                title: "Status",
                dataIndex: "status",
                render: (v: string) => <Tag color={getStatusColor(v)}>{v}</Tag>,
                width: 100,
              },
            ]}
          />
        </Spin>
      ),
    },
    {
      key: "slow-queries",
      label: (
        <span>
          <ThunderboltOutlined /> Slow Queries
        </span>
      ),
      children: (
        <Spin spinning={sqLoading}>
          {sqError && (
            <Alert
              type="error"
              message="Failed to load slow queries"
              showIcon
              style={{ marginBottom: 16 }}
            />
          )}
          <Space direction="vertical" size={16} style={{ width: "100%" }}>
            <Space>
              <Typography.Text style={{ color: "#9CA3AF" }}>
                Min duration (ms):
              </Typography.Text>
              <InputNumber
                value={durationThreshold}
                onChange={(v) => setDurationThreshold(v ?? 100)}
                min={0}
                step={50}
                size="small"
                style={{ width: 100 }}
              />
              <Input
                prefix={<SearchOutlined />}
                placeholder="Search queries..."
                value={querySearch}
                onChange={(e) => setQuerySearch(e.target.value)}
                allowClear
                size="small"
                style={{ width: 240 }}
              />
              <Button
                size="small"
                icon={<ReloadOutlined />}
                onClick={() => refetchSlowQueries()}
              >
                Refresh
              </Button>
            </Space>
            <Table
              dataSource={filteredQueries as SlowQuery[]}
              rowKey="id"
              pagination={{ pageSize: 10 }}
              expandable={{
                expandedRowRender: (record: SlowQuery) => (
                  <CodeBlock code={record.query} language="sql" />
                ),
              }}
              columns={[
                {
                  title: "Query (truncated)",
                  dataIndex: "query",
                  render: (v: string) => (
                    <Typography.Text
                      code
                      ellipsis
                      style={{ maxWidth: 400, fontSize: 12, display: "block" }}
                    >
                      {v}
                    </Typography.Text>
                  ),
                },
                {
                  title: "Mean Duration",
                  dataIndex: "duration",
                  render: (v: number) => (
                    <Tag color={v > 200 ? "error" : v > 100 ? "warning" : "success"}>
                      {formatDuration(v)}
                    </Tag>
                  ),
                  sorter: (a: SlowQuery, b: SlowQuery) => a.duration - b.duration,
                  width: 130,
                },
                {
                  title: "Table",
                  dataIndex: "table",
                  render: (v: string) => <Tag>{v}</Tag>,
                  width: 140,
                },
                {
                  title: "Call Count",
                  dataIndex: "rowsExamined",
                  render: (v: number) => formatNumber(v),
                  width: 130,
                },
                {
                  title: "Time",
                  dataIndex: "timestamp",
                  render: (v: string) => formatRelativeTime(v),
                  width: 140,
                },
              ]}
            />
          </Space>
        </Spin>
      ),
    },
    {
      key: "backups",
      label: (
        <span>
          <CloudDownloadOutlined /> Backups
        </span>
      ),
      children: (
        <Spin spinning={backupsLoading}>
          {backupsError && (
            <Alert
              type="error"
              message="Failed to load backups"
              showIcon
              style={{ marginBottom: 16 }}
            />
          )}
          <Space direction="vertical" size={16} style={{ width: "100%" }}>
            <div style={{ display: "flex", justifyContent: "flex-end" }}>
              <Button
                type="primary"
                icon={<PlayCircleOutlined />}
                onClick={handleTriggerBackup}
              >
                Trigger Backup
              </Button>
            </div>
            <Table
              dataSource={backups as unknown as DatabaseBackup[]}
              rowKey="id"
              pagination={false}
              columns={[
                {
                  title: "Backup Name",
                  dataIndex: "name",
                  render: (v: string) => (
                    <Typography.Text code style={{ fontSize: 12 }}>
                      {v}
                    </Typography.Text>
                  ),
                },
                {
                  title: "Type",
                  dataIndex: "type",
                  render: (v: string) => (
                    <Tag color={v === "full" ? "purple" : "blue"}>{v}</Tag>
                  ),
                  width: 110,
                },
                {
                  title: "Created",
                  dataIndex: "createdAt",
                  render: (v: string) => formatTimestamp(v),
                  width: 180,
                },
                {
                  title: "Size",
                  dataIndex: "sizeGB",
                  render: (v: number) => `${v} GB`,
                  width: 90,
                },
                {
                  title: "Status",
                  dataIndex: "status",
                  render: (v: string) => <Tag color={getStatusColor(v)}>{v.replace("_", " ")}</Tag>,
                  width: 120,
                },
                {
                  title: "Actions",
                  key: "actions",
                  width: 180,
                  render: (_: unknown, record: DatabaseBackup) => (
                    <Space>
                      <Button
                        size="small"
                        icon={<DownloadOutlined />}
                        disabled={record.status !== "completed"}
                      >
                        Download
                      </Button>
                      <Popconfirm
                        title="Restore this backup?"
                        description="This will replace the current database."
                        okText="Restore"
                        okType="danger"
                      >
                        <Button
                          size="small"
                          icon={<ReloadOutlined />}
                          danger
                          disabled={record.status !== "completed"}
                        >
                          Restore
                        </Button>
                      </Popconfirm>
                    </Space>
                  ),
                },
              ]}
            />
          </Space>
        </Spin>
      ),
    },
  ];

  return (
    <Space direction="vertical" size={24} style={{ width: "100%" }}>
      <Typography.Title level={3} style={{ margin: 0, color: COLORS.white }}>
        Database Management
      </Typography.Title>

      <Card
        style={{ background: "#1A1528", border: "1px solid #2D2640" }}
        styles={{ body: { padding: 0 } }}
      >
        <Tabs
          defaultActiveKey="schema"
          items={tabItems}
          tabBarStyle={{
            padding: "0 16px",
            borderBottom: "1px solid #2D2640",
          }}
          style={{ padding: "0 16px 16px" }}
        />
      </Card>
    </Space>
  );
};
