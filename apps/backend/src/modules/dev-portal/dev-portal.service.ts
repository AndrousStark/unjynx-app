// ── Dev Portal Service ──────────────────────────────────────────────
// Engineering-focused service providing system health, database info,
// API management, deployment, notification infra, AI models,
// channel providers, and data pipeline status.

import crypto from "node:crypto";
import { db, contentDb } from "../../db/index.js";
import { sql, gte, eq, desc, count } from "drizzle-orm";
import {
  deliveryAttempts,
  apiKeys as apiKeysTable,
  aiModelConfigs,
  pipelineRuns,
} from "../../db/schema/index.js";
import { getAllQueues } from "../../queue/queue-factory.js";
import type {
  ServiceStatus,
  SlowQueryInput,
  CreateApiKeyInput,
  AiModelConfig,
} from "./dev-portal.schema.js";

// ── System Health ───────────────────────────────────────────────────

const startTime = Date.now();

export async function getSystemHealth(): Promise<{
  readonly services: readonly ServiceStatus[];
  readonly overallStatus: "healthy" | "degraded" | "down";
}> {
  const services: ServiceStatus[] = [];

  // API Server
  const uptimeMs = Date.now() - startTime;
  services.push({
    name: "api-server",
    status: "healthy",
    uptime: uptimeMs,
    responseTimeMs: 0,
    errorRate: 0,
    details: {
      version: process.env.npm_package_version ?? "0.1.0",
      nodeVersion: process.version,
      memoryUsage: process.memoryUsage(),
      pid: process.pid,
    },
  });

  // Database
  const dbStart = Date.now();
  try {
    await db.execute(sql`SELECT 1`);
    const dbLatency = Date.now() - dbStart;

    const [pgStats] = await db.execute(
      sql`SELECT numbackends as active_connections,
             pg_database_size(current_database()) as db_size_bytes
         FROM pg_stat_database
         WHERE datname = current_database()`,
    );

    services.push({
      name: "postgresql",
      status: dbLatency < 100 ? "healthy" : dbLatency < 500 ? "degraded" : "down",
      uptime: uptimeMs,
      responseTimeMs: dbLatency,
      errorRate: 0,
      details: {
        activeConnections: (pgStats as Record<string, unknown>)?.active_connections ?? 0,
        databaseSizeBytes: (pgStats as Record<string, unknown>)?.db_size_bytes ?? 0,
      },
    });
  } catch {
    services.push({
      name: "postgresql",
      status: "down",
      uptime: 0,
      responseTimeMs: Date.now() - dbStart,
      errorRate: 100,
    });
  }

  // Cache (Valkey/Redis) - check via env
  const redisUrl = process.env.REDIS_URL;
  services.push({
    name: "valkey-cache",
    status: redisUrl ? "healthy" : "degraded",
    uptime: uptimeMs,
    responseTimeMs: 0,
    errorRate: redisUrl ? 0 : 100,
    details: {
      configured: !!redisUrl,
      mode: redisUrl ? "connected" : "in-memory-fallback",
    },
  });

  // Queue (BullMQ)
  services.push({
    name: "bullmq-queue",
    status: redisUrl ? "healthy" : "degraded",
    uptime: uptimeMs,
    responseTimeMs: 0,
    errorRate: 0,
    details: {
      queues: [
        "push", "telegram", "email", "whatsapp",
        "sms", "instagram", "slack", "discord",
        "digest", "escalation",
      ],
    },
  });

  // Auth (Logto)
  const logtoEndpoint = process.env.LOGTO_ENDPOINT;
  services.push({
    name: "logto-auth",
    status: logtoEndpoint ? "healthy" : "degraded",
    uptime: uptimeMs,
    responseTimeMs: 0,
    errorRate: 0,
    details: {
      endpoint: logtoEndpoint ? "(configured)" : "(not configured)",
    },
  });

  // Storage (MinIO)
  const minioEndpoint = process.env.MINIO_ENDPOINT;
  services.push({
    name: "minio-storage",
    status: minioEndpoint ? "healthy" : "degraded",
    uptime: uptimeMs,
    responseTimeMs: 0,
    errorRate: 0,
    details: {
      endpoint: minioEndpoint ? "(configured)" : "(not configured)",
    },
  });

  // AI (Ollama)
  const ollamaUrl = process.env.OLLAMA_URL;
  services.push({
    name: "ollama-ai",
    status: ollamaUrl ? "healthy" : "degraded",
    uptime: uptimeMs,
    responseTimeMs: 0,
    errorRate: 0,
    details: {
      url: ollamaUrl ? "(configured)" : "(not configured)",
      model: process.env.OLLAMA_MODEL ?? "llama3.2:3b",
    },
  });

  const downCount = services.filter((s) => s.status === "down").length;
  const degradedCount = services.filter((s) => s.status === "degraded").length;
  const overallStatus = downCount > 0 ? "down" : degradedCount > 0 ? "degraded" : "healthy";

  return { services, overallStatus };
}

// ── Database Management ─────────────────────────────────────────────

export interface TableInfo {
  readonly tableName: string;
  readonly rowCount: number;
  readonly sizeBytes: number;
  readonly columns: readonly ColumnInfo[];
  readonly indexes: readonly IndexInfo[];
}

export interface ColumnInfo {
  readonly name: string;
  readonly type: string;
  readonly nullable: boolean;
  readonly defaultValue: string | null;
}

export interface IndexInfo {
  readonly name: string;
  readonly columns: string;
  readonly isUnique: boolean;
  readonly isPrimary: boolean;
}

export async function getDatabaseSchema(): Promise<readonly TableInfo[]> {
  const tables = await db.execute(sql`
    SELECT
      t.table_name,
      pg_total_relation_size(quote_ident(t.table_name)::regclass) as size_bytes,
      (SELECT reltuples::bigint FROM pg_class WHERE relname = t.table_name) as row_estimate
    FROM information_schema.tables t
    WHERE t.table_schema = 'public'
      AND t.table_type = 'BASE TABLE'
    ORDER BY t.table_name
  `);

  const result: TableInfo[] = [];

  for (const table of tables as readonly Record<string, unknown>[]) {
    const tableName = table.table_name as string;

    const columns = await db.execute(sql`
      SELECT
        column_name as name,
        data_type as type,
        is_nullable = 'YES' as nullable,
        column_default as default_value
      FROM information_schema.columns
      WHERE table_schema = 'public' AND table_name = ${tableName}
      ORDER BY ordinal_position
    `);

    const indexes = await db.execute(sql`
      SELECT
        i.relname as name,
        array_to_string(array_agg(a.attname), ', ') as columns,
        ix.indisunique as is_unique,
        ix.indisprimary as is_primary
      FROM pg_class t
      JOIN pg_index ix ON t.oid = ix.indrelid
      JOIN pg_class i ON i.oid = ix.indexrelid
      JOIN pg_attribute a ON a.attrelid = t.oid AND a.attnum = ANY(ix.indkey)
      WHERE t.relname = ${tableName}
      GROUP BY i.relname, ix.indisunique, ix.indisprimary
      ORDER BY i.relname
    `);

    result.push({
      tableName,
      rowCount: Number(table.row_estimate ?? 0),
      sizeBytes: Number(table.size_bytes ?? 0),
      columns: (columns as readonly Record<string, unknown>[]).map((c) => ({
        name: c.name as string,
        type: c.type as string,
        nullable: c.nullable as boolean,
        defaultValue: c.default_value as string | null,
      })),
      indexes: (indexes as readonly Record<string, unknown>[]).map((i) => ({
        name: i.name as string,
        columns: i.columns as string,
        isUnique: i.is_unique as boolean,
        isPrimary: i.is_primary as boolean,
      })),
    });
  }

  return result;
}

export interface SlowQuery {
  readonly query: string;
  readonly callCount: number;
  readonly totalTimeMs: number;
  readonly meanTimeMs: number;
  readonly maxTimeMs: number;
  readonly minTimeMs: number;
}

export async function getSlowQueries(input: SlowQueryInput): Promise<readonly SlowQuery[]> {
  try {
    const queries = await db.execute(sql`
      SELECT
        query,
        calls as call_count,
        total_exec_time as total_time_ms,
        mean_exec_time as mean_time_ms,
        max_exec_time as max_time_ms,
        min_exec_time as min_time_ms
      FROM pg_stat_statements
      WHERE mean_exec_time > ${input.durationMs}
      ORDER BY mean_exec_time DESC
      LIMIT ${input.limit}
    `);

    return (queries as readonly Record<string, unknown>[]).map((q) => ({
      query: (q.query as string).slice(0, 500),
      callCount: Number(q.call_count ?? 0),
      totalTimeMs: Number(q.total_time_ms ?? 0),
      meanTimeMs: Number(q.mean_time_ms ?? 0),
      maxTimeMs: Number(q.max_time_ms ?? 0),
      minTimeMs: Number(q.min_time_ms ?? 0),
    }));
  } catch {
    // pg_stat_statements extension may not be enabled
    return [];
  }
}

export interface MigrationEntry {
  readonly version: string;
  readonly name: string;
  readonly appliedAt: string;
}

export async function getMigrationHistory(): Promise<readonly MigrationEntry[]> {
  try {
    const migrations = await db.execute(sql`
      SELECT hash as version, created_at as applied_at
      FROM drizzle.__drizzle_migrations
      ORDER BY created_at DESC
    `);

    return (migrations as readonly Record<string, unknown>[]).map((m, i) => ({
      version: String(m.version ?? i),
      name: `migration_${i + 1}`,
      appliedAt: String(m.applied_at ?? ""),
    }));
  } catch {
    return [];
  }
}

// ── API Management ──────────────────────────────────────────────────

function hashKey(raw: string): string {
  return crypto.createHash("sha256").update(raw).digest("hex");
}

export async function listApiKeys() {
  const rows = await db
    .select({
      id: apiKeysTable.id,
      name: apiKeysTable.name,
      keyPrefix: apiKeysTable.keyPrefix,
      scopes: apiKeysTable.scopes,
      createdAt: apiKeysTable.createdAt,
      expiresAt: apiKeysTable.expiresAt,
      lastUsedAt: apiKeysTable.lastUsedAt,
      isActive: apiKeysTable.isActive,
    })
    .from(apiKeysTable)
    .where(eq(apiKeysTable.isActive, true));

  return rows.map((k) => ({
    id: k.id,
    name: k.name,
    keyPrefix: k.keyPrefix,
    scopes: k.scopes,
    createdAt: k.createdAt.toISOString(),
    expiresAt: k.expiresAt.toISOString(),
    lastUsedAt: k.lastUsedAt?.toISOString() ?? null,
    isActive: k.isActive,
  }));
}

export async function createApiKey(input: CreateApiKeyInput) {
  const rawKey = `unjx_${crypto.randomBytes(32).toString("hex")}`;
  const keyHashValue = hashKey(rawKey);
  const keyPrefix = rawKey.slice(0, 12);
  const expiresAt = new Date(
    Date.now() + input.expiresInDays * 24 * 60 * 60 * 1000,
  );

  // userId is required by the schema; for admin-created keys we use a
  // system placeholder. In production the calling admin's profileId
  // should be passed through. For now, insert with a generated UUID
  // that represents "system-generated".
  const [row] = await db
    .insert(apiKeysTable)
    .values({
      name: input.name,
      keyHash: keyHashValue,
      keyPrefix,
      scopes: [...input.scopes],
      expiresAt,
      // userId will be provided by the route handler via input extension
      userId: (input as CreateApiKeyInput & { userId?: string }).userId
        ?? "00000000-0000-0000-0000-000000000000",
    })
    .returning({ id: apiKeysTable.id });

  return { id: row.id, key: rawKey, expiresAt: expiresAt.toISOString() };
}

export async function revokeApiKey(keyId: string): Promise<boolean> {
  const result = await db
    .update(apiKeysTable)
    .set({ isActive: false })
    .where(eq(apiKeysTable.id, keyId))
    .returning({ id: apiKeysTable.id });

  return result.length > 0;
}

export interface EndpointUsage {
  readonly endpoint: string;
  readonly method: string;
  readonly totalRequests: number;
  readonly avgResponseMs: number;
  readonly errorCount: number;
  readonly lastCalledAt: string;
}

export function getApiUsage(): readonly EndpointUsage[] {
  // Placeholder: production version would aggregate from request logs
  return [
    { endpoint: "/api/v1/tasks", method: "GET", totalRequests: 15420, avgResponseMs: 23, errorCount: 12, lastCalledAt: new Date().toISOString() },
    { endpoint: "/api/v1/tasks", method: "POST", totalRequests: 3210, avgResponseMs: 45, errorCount: 8, lastCalledAt: new Date().toISOString() },
    { endpoint: "/api/v1/sync/push", method: "POST", totalRequests: 8900, avgResponseMs: 120, errorCount: 45, lastCalledAt: new Date().toISOString() },
    { endpoint: "/api/v1/content/today", method: "GET", totalRequests: 12300, avgResponseMs: 15, errorCount: 2, lastCalledAt: new Date().toISOString() },
    { endpoint: "/api/v1/auth/callback", method: "POST", totalRequests: 2100, avgResponseMs: 350, errorCount: 89, lastCalledAt: new Date().toISOString() },
  ];
}

// ── Deployment ──────────────────────────────────────────────────────

export interface DeployEntry {
  readonly id: string;
  readonly service: string;
  readonly commit: string;
  readonly deployer: string;
  readonly status: "success" | "failed" | "rolling_back" | "in_progress";
  readonly durationMs: number;
  readonly deployedAt: string;
  readonly environment: string;
}

interface GitHubWorkflowRun {
  readonly id: number;
  readonly name: string;
  readonly head_sha: string;
  readonly conclusion: string | null;
  readonly status: string;
  readonly run_started_at: string;
  readonly updated_at: string;
  readonly actor?: { readonly login: string };
}

function mapGhStatus(
  conclusion: string | null,
  status: string,
): DeployEntry["status"] {
  if (status === "in_progress" || status === "queued") return "in_progress";
  if (conclusion === "success") return "success";
  if (conclusion === "failure") return "failed";
  return "failed";
}

export async function getDeployHistory(): Promise<readonly DeployEntry[]> {
  const pat = process.env.GITHUB_PAT;
  if (!pat) return [];

  try {
    const res = await fetch(
      "https://api.github.com/repos/AndrousStark/unjynx-backend/actions/runs?per_page=10",
      {
        headers: {
          Authorization: `Bearer ${pat}`,
          Accept: "application/vnd.github+json",
          "X-GitHub-Api-Version": "2022-11-28",
        },
        signal: AbortSignal.timeout(8000),
      },
    );

    if (!res.ok) return [];

    const data = (await res.json()) as {
      readonly workflow_runs: readonly GitHubWorkflowRun[];
    };

    return data.workflow_runs.map((run) => {
      const startMs = new Date(run.run_started_at).getTime();
      const endMs = new Date(run.updated_at).getTime();
      return {
        id: `gh_${run.id}`,
        service: run.name.toLowerCase().includes("deploy")
          ? "backend"
          : run.name,
        commit: run.head_sha.slice(0, 7),
        deployer: run.actor?.login ?? "ci/cd",
        status: mapGhStatus(run.conclusion, run.status),
        durationMs: Math.max(0, endMs - startMs),
        deployedAt: run.run_started_at,
        environment: "production",
      };
    });
  } catch {
    return [];
  }
}

export interface ServiceDeployStatus {
  readonly service: string;
  readonly status: "running" | "stopped" | "deploying";
  readonly version: string;
  readonly lastDeployedAt: string;
  readonly environment: string;
}

export async function getServiceStatuses(): Promise<readonly ServiceDeployStatus[]> {
  const services = [
    {
      service: "backend-api",
      url: "http://127.0.0.1:3000/health",
      version: process.env.npm_package_version ?? "0.1.0",
    },
    {
      service: "logto-auth",
      url: process.env.LOGTO_ENDPOINT
        ? `${process.env.LOGTO_ENDPOINT}/.well-known/openid-configuration`
        : null,
      version: "latest",
    },
  ];

  const results = await Promise.all(
    services.map(async (svc): Promise<ServiceDeployStatus> => {
      if (!svc.url) {
        return {
          service: svc.service,
          status: "stopped",
          version: svc.version,
          lastDeployedAt: "",
          environment: process.env.NODE_ENV ?? "development",
        };
      }

      try {
        const res = await fetch(svc.url, {
          signal: AbortSignal.timeout(5000),
        });

        return {
          service: svc.service,
          status: res.ok ? "running" : "deploying",
          version: svc.version,
          lastDeployedAt: new Date().toISOString(),
          environment: process.env.NODE_ENV ?? "development",
        };
      } catch {
        return {
          service: svc.service,
          status: "stopped",
          version: svc.version,
          lastDeployedAt: "",
          environment: process.env.NODE_ENV ?? "development",
        };
      }
    }),
  );

  return results;
}

// ── Notification Infrastructure ─────────────────────────────────────

export interface ChannelHealth {
  readonly channel: string;
  readonly provider: string;
  readonly status: "healthy" | "degraded" | "down";
  readonly deliveryRate: number;
  readonly messagesSentToday: number;
  readonly costToday: number;
  readonly lastCheckedAt: string;
  readonly details: Record<string, unknown>;
}

// Provider mapping for display purposes
const CHANNEL_PROVIDER_MAP: Readonly<Record<string, string>> = {
  push: "FCM",
  telegram: "Bot API",
  email: "SendGrid",
  whatsapp: "Gupshup",
  sms: "MSG91",
  instagram: "Messenger API",
  slack: "Slack Web API",
  discord: "Discord Bot API",
};

export async function getNotificationInfraHealth(): Promise<readonly ChannelHealth[]> {
  const dayAgo = new Date(Date.now() - 86_400_000);

  try {
    // Aggregate delivery stats by channel for last 24h (VPS contentDb)
    const stats = await contentDb
      .select({
        channel: deliveryAttempts.channel,
        total: count(),
        delivered: sql<number>`count(*) filter (where ${deliveryAttempts.status} = 'delivered')`,
        sent: sql<number>`count(*) filter (where ${deliveryAttempts.status} = 'sent')`,
        failed: sql<number>`count(*) filter (where ${deliveryAttempts.status} = 'failed')`,
      })
      .from(deliveryAttempts)
      .where(gte(deliveryAttempts.createdAt, dayAgo))
      .groupBy(deliveryAttempts.channel);

    if (stats.length === 0) {
      // No delivery attempts in last 24h — return all channels with N/A
      return Object.entries(CHANNEL_PROVIDER_MAP).map(([channel, provider]) => ({
        channel,
        provider,
        status: "healthy" as const,
        deliveryRate: 0,
        messagesSentToday: 0,
        costToday: 0,
        lastCheckedAt: new Date().toISOString(),
        details: { note: "No delivery attempts in the last 24 hours" },
      }));
    }

    return stats.map((s) => {
      const total = Number(s.total);
      const delivered = Number(s.delivered);
      const sent = Number(s.sent);
      const failed = Number(s.failed);
      const successCount = delivered + sent;
      const deliveryRate = total > 0 ? (successCount / total) * 100 : 0;
      const channelStatus: "healthy" | "degraded" | "down" =
        failed > total * 0.25 ? "down" : failed > total * 0.1 ? "degraded" : "healthy";

      return {
        channel: s.channel,
        provider: CHANNEL_PROVIDER_MAP[s.channel] ?? "Unknown",
        status: channelStatus,
        deliveryRate: Math.round(deliveryRate * 10) / 10,
        messagesSentToday: total,
        costToday: 0, // Cost aggregation requires separate query on cost_amount
        lastCheckedAt: new Date().toISOString(),
        details: {
          delivered,
          sent,
          failed,
          pending: total - delivered - sent - failed,
        },
      };
    });
  } catch {
    // Fallback if DB query fails
    return Object.entries(CHANNEL_PROVIDER_MAP).map(([channel, provider]) => ({
      channel,
      provider,
      status: "degraded" as const,
      deliveryRate: 0,
      messagesSentToday: 0,
      costToday: 0,
      lastCheckedAt: new Date().toISOString(),
      details: { error: "Failed to query delivery_attempts table" },
    }));
  }
}

export interface QueueDepth {
  readonly queue: string;
  readonly active: number;
  readonly waiting: number;
  readonly delayed: number;
  readonly failed: number;
  readonly completed: number;
  readonly processingRate: number;
}

export async function getQueueDepths(): Promise<readonly QueueDepth[]> {
  const allQueues = getAllQueues();
  const results: QueueDepth[] = [];

  for (const [name, queue] of allQueues) {
    try {
      const counts = await queue.getJobCounts(
        "waiting",
        "active",
        "delayed",
        "failed",
        "completed",
      );
      results.push({
        queue: name.replace("notification:", ""),
        active: counts.active ?? 0,
        waiting: counts.waiting ?? 0,
        delayed: counts.delayed ?? 0,
        failed: counts.failed ?? 0,
        completed: counts.completed ?? 0,
        processingRate: 0, // Real rate requires time-series tracking
      });
    } catch {
      // Queue may be unreachable; report zeroes
      results.push({
        queue: name.replace("notification:", ""),
        active: 0,
        waiting: 0,
        delayed: 0,
        failed: 0,
        completed: 0,
        processingRate: 0,
      });
    }
  }

  // If no queues initialized yet, return a placeholder
  if (results.length === 0) {
    return [{
      queue: "none",
      active: 0,
      waiting: 0,
      delayed: 0,
      failed: 0,
      completed: 0,
      processingRate: 0,
    }];
  }

  return results;
}

// ── AI Model Management ─────────────────────────────────────────────

export async function listAiModels() {
  const rows = await db.select().from(aiModelConfigs);

  return rows.map((r) => ({
    key: r.key,
    modelId: r.modelId,
    provider: r.provider,
    maxTokens: r.maxTokens,
    temperature: r.temperature,
    isActive: r.isActive,
    updatedAt: r.updatedAt.toISOString(),
  }));
}

export async function updateAiModel(
  key: string,
  config: AiModelConfig,
): Promise<boolean> {
  const result = await db
    .update(aiModelConfigs)
    .set({
      modelId: config.modelId,
      provider: config.provider,
      maxTokens: config.maxTokens,
      temperature: config.temperature,
      isActive: config.isActive,
      updatedAt: new Date(),
    })
    .where(eq(aiModelConfigs.key, key))
    .returning({ key: aiModelConfigs.key });

  return result.length > 0;
}

export interface AiUsageMetrics {
  readonly modelKey: string;
  readonly totalRequests: number;
  readonly totalTokens: number;
  readonly avgResponseMs: number;
  readonly errorRate: number;
  readonly costUsd: number;
}

export async function getAiUsageMetrics(): Promise<readonly AiUsageMetrics[]> {
  // Real AI usage tracking comes in v2-AI phase. For now, return
  // zero-usage rows from the aiModelConfigs table so the UI is wired
  // to real model keys but shows no traffic yet.
  const models = await db
    .select({ key: aiModelConfigs.key })
    .from(aiModelConfigs)
    .where(eq(aiModelConfigs.isActive, true));

  return models.map((m) => ({
    modelKey: m.key,
    totalRequests: 0,
    totalTokens: 0,
    avgResponseMs: 0,
    errorRate: 0,
    costUsd: 0,
  }));
}

// ── Channel Providers ───────────────────────────────────────────────

export interface ProviderStatus {
  readonly channel: string;
  readonly provider: string;
  readonly apiHealthy: boolean;
  readonly lastHealthCheck: string;
  readonly credentials: "configured" | "missing" | "expired";
  readonly details: Record<string, unknown>;
}

export async function getChannelProviderStatuses(): Promise<readonly ProviderStatus[]> {
  const env = process.env;
  const dayAgo = new Date(Date.now() - 86_400_000);

  // Fetch real 24h message counts per channel from delivery_attempts
  let channelCounts: Record<string, { total: number; failed: number }> = {};
  try {
    const stats = await contentDb
      .select({
        channel: deliveryAttempts.channel,
        total: count(),
        failed: sql<number>`count(*) filter (where ${deliveryAttempts.status} = 'failed')`,
      })
      .from(deliveryAttempts)
      .where(gte(deliveryAttempts.createdAt, dayAgo))
      .groupBy(deliveryAttempts.channel);

    channelCounts = Object.fromEntries(
      stats.map((s) => [
        s.channel,
        { total: Number(s.total), failed: Number(s.failed) },
      ]),
    );
  } catch {
    // DB unavailable — all counts stay at 0
  }

  const getStats = (ch: string) =>
    channelCounts[ch] ?? { total: 0, failed: 0 };

  return [
    {
      channel: "telegram",
      provider: "Bot API",
      apiHealthy: !!env.TELEGRAM_BOT_TOKEN,
      lastHealthCheck: new Date().toISOString(),
      credentials: env.TELEGRAM_BOT_TOKEN ? "configured" : "missing",
      details: {
        botUsername: env.TELEGRAM_BOT_USERNAME ?? "(not set)",
        webhookUrl: env.TELEGRAM_WEBHOOK_URL ?? "(not set)",
        messagesSent24h: getStats("telegram").total,
        failedCount24h: getStats("telegram").failed,
      },
    },
    {
      channel: "whatsapp",
      provider: "Gupshup",
      apiHealthy: !!env.GUPSHUP_API_KEY,
      lastHealthCheck: new Date().toISOString(),
      credentials: env.GUPSHUP_API_KEY ? "configured" : "missing",
      details: {
        messagesSent24h: getStats("whatsapp").total,
        failedCount24h: getStats("whatsapp").failed,
      },
    },
    {
      channel: "instagram",
      provider: "Messenger API",
      apiHealthy: !!env.INSTAGRAM_PAGE_TOKEN,
      lastHealthCheck: new Date().toISOString(),
      credentials: env.INSTAGRAM_PAGE_TOKEN ? "configured" : "missing",
      details: {
        messagesSent24h: getStats("instagram").total,
        failedCount24h: getStats("instagram").failed,
      },
    },
    {
      channel: "sms",
      provider: "MSG91",
      apiHealthy: !!env.MSG91_AUTH_KEY,
      lastHealthCheck: new Date().toISOString(),
      credentials: env.MSG91_AUTH_KEY ? "configured" : "missing",
      details: {
        messagesSent24h: getStats("sms").total,
        failedCount24h: getStats("sms").failed,
      },
    },
    {
      channel: "email",
      provider: "SendGrid",
      apiHealthy: !!env.SENDGRID_API_KEY,
      lastHealthCheck: new Date().toISOString(),
      credentials: env.SENDGRID_API_KEY ? "configured" : "missing",
      details: {
        messagesSent24h: getStats("email").total,
        failedCount24h: getStats("email").failed,
      },
    },
    {
      channel: "push",
      provider: "FCM",
      apiHealthy: !!env.FCM_SERVER_KEY,
      lastHealthCheck: new Date().toISOString(),
      credentials: env.FCM_SERVER_KEY ? "configured" : "missing",
      details: {
        messagesSent24h: getStats("push").total,
        failedCount24h: getStats("push").failed,
      },
    },
    {
      channel: "slack",
      provider: "Slack Web API",
      apiHealthy: !!env.SLACK_BOT_TOKEN,
      lastHealthCheck: new Date().toISOString(),
      credentials: env.SLACK_BOT_TOKEN ? "configured" : "missing",
      details: {
        messagesSent24h: getStats("slack").total,
        failedCount24h: getStats("slack").failed,
      },
    },
    {
      channel: "discord",
      provider: "Discord Bot API",
      apiHealthy: !!env.DISCORD_BOT_TOKEN,
      lastHealthCheck: new Date().toISOString(),
      credentials: env.DISCORD_BOT_TOKEN ? "configured" : "missing",
      details: {
        messagesSent24h: getStats("discord").total,
        failedCount24h: getStats("discord").failed,
      },
    },
  ];
}

// ── Data Pipeline ───────────────────────────────────────────────────

export interface PipelineStatus {
  readonly name: string;
  readonly description: string;
  readonly schedule: string;
  readonly lastRun: string | null;
  readonly nextRun: string;
  readonly status: "idle" | "running" | "succeeded" | "failed";
  readonly durationMs: number | null;
  readonly errorMessage: string | null;
}

// Pipeline definitions — schedule & description are config, runtime data
// comes from the pipeline_runs table.
const PIPELINE_DEFINITIONS: ReadonlyArray<{
  readonly name: string;
  readonly description: string;
  readonly schedule: string;
}> = [
  { name: "content-ingestion", description: "Ingest daily content from CSV/API sources", schedule: "0 2 * * *" },
  { name: "user-analytics-aggregation", description: "Aggregate user engagement metrics for analytics dashboards", schedule: "0 */6 * * *" },
  { name: "notification-cost-aggregation", description: "Calculate notification costs per channel per user", schedule: "0 0 * * *" },
  { name: "database-backup", description: "Full PostgreSQL pg_dump to MinIO", schedule: "0 3 * * *" },
  { name: "data-anonymization", description: "Anonymize PII for deleted/GDPR accounts", schedule: "0 4 * * 0" },
  { name: "stale-token-cleanup", description: "Remove expired FCM tokens and revoked API keys", schedule: "0 5 * * *" },
];

export async function getDataPipelineStatuses(): Promise<
  readonly PipelineStatus[]
> {
  // Fetch the latest run per pipeline from the pipeline_runs table
  let latestRuns: Record<
    string,
    {
      readonly status: string;
      readonly startedAt: Date;
      readonly completedAt: Date | null;
      readonly errorMessage: string | null;
    }
  > = {};

  try {
    // Use a subquery approach: for each pipeline name, get the most recent run
    const rows = await db
      .select({
        pipelineName: pipelineRuns.pipelineName,
        status: pipelineRuns.status,
        startedAt: pipelineRuns.startedAt,
        completedAt: pipelineRuns.completedAt,
        errorMessage: pipelineRuns.errorMessage,
      })
      .from(pipelineRuns)
      .orderBy(desc(pipelineRuns.startedAt));

    // Group by pipeline name, take only the first (latest) per name
    const seen = new Set<string>();
    for (const row of rows) {
      if (!seen.has(row.pipelineName)) {
        seen.add(row.pipelineName);
        latestRuns[row.pipelineName] = {
          status: row.status,
          startedAt: row.startedAt,
          completedAt: row.completedAt,
          errorMessage: row.errorMessage,
        };
      }
    }
  } catch {
    // Table may not exist yet — fall through with empty map
  }

  return PIPELINE_DEFINITIONS.map((def) => {
    const run = latestRuns[def.name];
    const durationMs =
      run?.completedAt && run.startedAt
        ? run.completedAt.getTime() - run.startedAt.getTime()
        : null;

    const statusMap: Record<string, PipelineStatus["status"]> = {
      running: "running",
      completed: "succeeded",
      failed: "failed",
    };

    return {
      name: def.name,
      description: def.description,
      schedule: def.schedule,
      lastRun: run?.startedAt.toISOString() ?? null,
      nextRun: "", // Would require cron-parser for accurate next run
      status: run ? (statusMap[run.status] ?? "idle") : "idle",
      durationMs,
      errorMessage: run?.errorMessage ?? null,
    };
  });
}

export interface BackupInfo {
  readonly id: string;
  readonly createdAt: string;
  readonly sizeBytes: number;
  readonly status: "completed" | "failed" | "in_progress";
  readonly verified: boolean;
  readonly lastVerifiedAt: string | null;
}

export async function getBackups(): Promise<readonly BackupInfo[]> {
  try {
    const rows = await db
      .select({
        id: pipelineRuns.id,
        status: pipelineRuns.status,
        startedAt: pipelineRuns.startedAt,
        completedAt: pipelineRuns.completedAt,
        itemsProcessed: pipelineRuns.itemsProcessed,
        errorMessage: pipelineRuns.errorMessage,
      })
      .from(pipelineRuns)
      .where(eq(pipelineRuns.pipelineName, "database-backup"))
      .orderBy(desc(pipelineRuns.startedAt))
      .limit(20);

    return rows.map((r) => {
      const statusMap: Record<string, BackupInfo["status"]> = {
        completed: "completed",
        failed: "failed",
        running: "in_progress",
      };

      return {
        id: r.id,
        createdAt: r.startedAt.toISOString(),
        sizeBytes: r.itemsProcessed ?? 0, // itemsProcessed stores size for backups
        status: statusMap[r.status] ?? "failed",
        verified: r.status === "completed" && !r.errorMessage,
        lastVerifiedAt: r.completedAt?.toISOString() ?? null,
      };
    });
  } catch {
    // Table may not exist yet — return empty
    return [];
  }
}
