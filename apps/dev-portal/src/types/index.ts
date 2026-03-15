// ============================================================
// UNJYNX Dev Portal - Type Definitions
// ============================================================

// --- System Health (R1) ---

export type ServiceStatus = "healthy" | "degraded" | "down" | "unknown";

export interface ServiceHealth {
  readonly name: string;
  readonly status: ServiceStatus;
  readonly uptime: number;
  readonly lastCheck: string;
  readonly metrics: Record<string, number | string>;
}

export interface ApiServerMetrics {
  readonly uptime: number;
  readonly rps: number;
  readonly errorRate: number;
  readonly p50: number;
  readonly p95: number;
  readonly p99: number;
}

export interface DatabaseMetrics {
  readonly activeConnections: number;
  readonly avgQueryTime: number;
  readonly replicationLag: number;
  readonly diskUsagePercent: number;
  readonly diskUsageGB: number;
}

export interface CacheMetrics {
  readonly memoryUsedMB: number;
  readonly memoryMaxMB: number;
  readonly hitRate: number;
  readonly totalKeys: number;
  readonly evictions: number;
}

export interface QueueMetrics {
  readonly active: number;
  readonly waiting: number;
  readonly failed: number;
  readonly completed: number;
  readonly depthHistory: ReadonlyArray<{ readonly time: string; readonly depth: number }>;
}

export interface AuthMetrics {
  readonly loginSuccessRate: number;
  readonly mfaAdoption: number;
  readonly activeSessions: number;
}

export interface StorageMetrics {
  readonly bucketSizeGB: number;
  readonly uploadRatePerMin: number;
  readonly totalObjects: number;
}

export interface AiMetrics {
  readonly requestRate: number;
  readonly avgResponseTime: number;
  readonly tokenUsage: number;
}

export interface AlertEvent {
  readonly id: string;
  readonly severity: "info" | "warning" | "critical";
  readonly service: string;
  readonly message: string;
  readonly timestamp: string;
  readonly resolved: boolean;
}

// --- Database Management (R2) ---

export interface TableColumn {
  readonly name: string;
  readonly type: string;
  readonly nullable: boolean;
  readonly defaultValue: string | null;
  readonly isPrimaryKey: boolean;
  readonly isForeignKey: boolean;
  readonly references: string | null;
}

export interface TableIndex {
  readonly name: string;
  readonly columns: ReadonlyArray<string>;
  readonly unique: boolean;
  readonly type: string;
}

export interface TableSchema {
  readonly name: string;
  readonly columns: ReadonlyArray<TableColumn>;
  readonly indexes: ReadonlyArray<TableIndex>;
  readonly rowCount: number;
  readonly sizeKB: number;
}

export interface Migration {
  readonly id: string;
  readonly name: string;
  readonly appliedAt: string;
  readonly duration: number;
  readonly status: "applied" | "pending" | "failed";
}

export interface SlowQuery {
  readonly id: string;
  readonly query: string;
  readonly duration: number;
  readonly timestamp: string;
  readonly table: string;
  readonly rowsExamined: number;
}

export interface DatabaseBackup {
  readonly id: string;
  readonly name: string;
  readonly createdAt: string;
  readonly sizeGB: number;
  readonly status: "completed" | "in_progress" | "failed";
  readonly type: "full" | "incremental";
}

// --- API Management (R3) ---

export interface ApiKey {
  readonly id: string;
  readonly name: string;
  readonly keyPrefix: string;
  readonly createdAt: string;
  readonly expiresAt: string | null;
  readonly lastUsed: string | null;
  readonly status: "active" | "revoked" | "expired";
  readonly scopes: ReadonlyArray<string>;
}

export interface RateLimitConfig {
  readonly endpoint: string;
  readonly method: string;
  readonly windowMs: number;
  readonly maxRequests: number;
  readonly currentUsage: number;
}

export interface WebhookConfig {
  readonly id: string;
  readonly url: string;
  readonly events: ReadonlyArray<string>;
  readonly status: "active" | "inactive" | "failing";
  readonly lastDelivery: string | null;
  readonly successRate: number;
}

export interface WebhookDeliveryLog {
  readonly id: string;
  readonly webhookId: string;
  readonly event: string;
  readonly statusCode: number;
  readonly responseTime: number;
  readonly timestamp: string;
  readonly success: boolean;
}

export interface EndpointUsage {
  readonly endpoint: string;
  readonly method: string;
  readonly totalRequests: number;
  readonly avgResponseTime: number;
  readonly errorRate: number;
  readonly history: ReadonlyArray<{ readonly time: string; readonly count: number }>;
}

// --- Deployment (R4) ---

export interface DeployService {
  readonly name: string;
  readonly status: "running" | "stopped" | "deploying" | "error";
  readonly version: string;
  readonly lastDeploy: string;
  readonly environment: string;
}

export interface DeployHistory {
  readonly id: string;
  readonly service: string;
  readonly timestamp: string;
  readonly commit: string;
  readonly deployer: string;
  readonly status: "success" | "failed" | "rolled_back" | "in_progress";
  readonly duration: number;
}

export interface FeatureFlag {
  readonly id: string;
  readonly name: string;
  readonly description: string;
  readonly enabled: boolean;
  readonly environment: "development" | "staging" | "production";
  readonly updatedAt: string;
  readonly updatedBy: string;
}

export interface EnvVariable {
  readonly key: string;
  readonly value: string;
  readonly environment: "development" | "staging" | "production";
  readonly isSecret: boolean;
  readonly updatedAt: string;
}

// --- Notification Infrastructure (R5) ---

export type ChannelType =
  | "whatsapp"
  | "telegram"
  | "email"
  | "sms"
  | "push"
  | "instagram"
  | "slack"
  | "discord";

export interface ChannelHealth {
  readonly channel: ChannelType;
  readonly provider: string;
  readonly status: ServiceStatus;
  readonly deliveryRate: number;
  readonly avgLatency: number;
  readonly lastCheck: string;
}

export interface NotificationTemplate {
  readonly id: string;
  readonly name: string;
  readonly channel: ChannelType;
  readonly status: "approved" | "pending" | "rejected";
  readonly lastModified: string;
  readonly version: number;
}

export interface DeliveryStats {
  readonly channel: ChannelType;
  readonly period: "24h" | "7d" | "30d";
  readonly sent: number;
  readonly delivered: number;
  readonly failed: number;
  readonly pending: number;
  readonly history: ReadonlyArray<{ readonly time: string; readonly rate: number }>;
}

export interface ChannelCost {
  readonly channel: ChannelType;
  readonly daily: number;
  readonly weekly: number;
  readonly monthly: number;
  readonly perMessage: number;
  readonly currency: string;
}

// --- AI Model Management (R6) ---

export interface AiModelConfig {
  readonly id: string;
  readonly provider: string;
  readonly modelId: string;
  readonly maxTokens: number;
  readonly temperature: number;
  readonly purpose: string;
  readonly status: "active" | "inactive" | "testing";
}

export interface PromptVersion {
  readonly id: string;
  readonly promptName: string;
  readonly version: number;
  readonly content: string;
  readonly createdAt: string;
  readonly createdBy: string;
  readonly status: "active" | "archived" | "draft";
}

export interface ModelCost {
  readonly modelId: string;
  readonly provider: string;
  readonly tokensUsed: number;
  readonly totalCost: number;
  readonly avgCostPerRequest: number;
  readonly period: string;
}

export interface ModelQuality {
  readonly modelId: string;
  readonly successRate: number;
  readonly avgResponseTime: number;
  readonly errorRate: number;
  readonly totalRequests: number;
}

export interface AbTestConfig {
  readonly id: string;
  readonly name: string;
  readonly promptA: string;
  readonly promptB: string;
  readonly trafficSplit: number;
  readonly status: "running" | "completed" | "paused";
  readonly winner: "A" | "B" | null;
  readonly startDate: string;
}

// --- Channel Providers (R7) ---

export interface ProviderStatus {
  readonly channel: string;
  readonly provider: string;
  readonly apiHealthy: boolean;
  readonly lastHealthCheck: string;
  readonly credentials: "configured" | "missing" | "expired";
  readonly details: Record<string, unknown>;
}

export interface TelegramBotStatus {
  readonly botUsername: string;
  readonly isOnline: boolean;
  readonly webhookUrl: string;
  readonly totalMessages: number;
  readonly activeChats: number;
  readonly lastActivity: string;
}

export interface WhatsAppProviderStatus {
  readonly bspHealth: ServiceStatus;
  readonly approvedTemplates: number;
  readonly pendingTemplates: number;
  readonly messageQuota: number;
  readonly messagesUsed: number;
  readonly qualityRating: "green" | "yellow" | "red";
}

export interface InstagramStatus {
  readonly apiStatus: ServiceStatus;
  readonly activeWindows: number;
  readonly pendingFriendRequests: number;
  readonly connectedAccounts: number;
}

export interface SmsProviderStatus {
  readonly dltRegistered: boolean;
  readonly approvedTemplates: number;
  readonly pendingTemplates: number;
  readonly dndFilterRate: number;
  readonly dailyQuota: number;
  readonly dailyUsed: number;
}

export interface EmailProviderStatus {
  readonly domainReputation: number;
  readonly bounceRate: number;
  readonly spamComplaintRate: number;
  readonly senderScore: number;
  readonly dailySent: number;
}

export interface PushProviderStatus {
  readonly tokenValidityRate: number;
  readonly deliverySuccessRate: number;
  readonly totalRegistered: number;
  readonly activeTokens: number;
}

export interface SlackBotStatus {
  readonly workspaceConnections: number;
  readonly botStatus: ServiceStatus;
  readonly totalChannels: number;
  readonly messagesSent: number;
}

export interface DiscordBotStatus {
  readonly serverConnections: number;
  readonly botStatus: ServiceStatus;
  readonly totalGuilds: number;
  readonly messagesSent: number;
}

// --- Data Pipeline (R8) ---

export interface EtlJob {
  readonly id: string;
  readonly name: string;
  readonly schedule: string;
  readonly lastRun: string;
  readonly nextRun: string;
  readonly status: "running" | "completed" | "failed" | "scheduled";
  readonly duration: number;
  readonly recordsProcessed: number;
}

export interface ContentPipelineStage {
  readonly stage: "ingestion" | "processing" | "delivery";
  readonly status: ServiceStatus;
  readonly itemsInQueue: number;
  readonly processedToday: number;
  readonly errorRate: number;
  readonly avgProcessingTime: number;
}

export interface BackupVerification {
  readonly backupId: string;
  readonly lastVerified: string;
  readonly integrityCheck: "passed" | "failed" | "pending";
  readonly checksumMatch: boolean;
  readonly restoreTestResult: "success" | "failed" | "not_tested";
}

export interface AnonymizationStatus {
  readonly tableName: string;
  readonly piiFields: ReadonlyArray<string>;
  readonly anonymized: boolean;
  readonly lastAnonymized: string | null;
  readonly complianceStatus: "compliant" | "non_compliant" | "pending";
}

export interface PipelineMetric {
  readonly name: string;
  readonly throughput: number;
  readonly errorRate: number;
  readonly lag: number;
  readonly history: ReadonlyArray<{ readonly time: string; readonly value: number }>;
}

// --- Backend API Response Types ---
// These match the exact shapes returned by /api/v1/dev-portal/* endpoints

export interface ApiServiceStatus {
  readonly name: string;
  readonly status: "healthy" | "degraded" | "down";
  readonly uptime: number;
  readonly responseTimeMs: number;
  readonly errorRate: number;
  readonly details?: Record<string, unknown>;
}

export interface ApiHealthResponse {
  readonly services: ReadonlyArray<ApiServiceStatus>;
  readonly overallStatus: "healthy" | "degraded" | "down";
}

export interface ApiTableInfo {
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

export interface ApiSlowQuery {
  readonly query: string;
  readonly callCount: number;
  readonly totalTimeMs: number;
  readonly meanTimeMs: number;
  readonly maxTimeMs: number;
  readonly minTimeMs: number;
}

export interface ApiMigration {
  readonly version: string;
  readonly name: string;
  readonly appliedAt: string;
}

export interface ApiBackup {
  readonly id: string;
  readonly createdAt: string;
  readonly sizeBytes: number;
  readonly status: "completed" | "failed" | "in_progress";
  readonly verified: boolean;
  readonly lastVerifiedAt: string | null;
}

export interface ApiEndpointUsage {
  readonly endpoint: string;
  readonly method: string;
  readonly totalRequests: number;
  readonly avgResponseMs: number;
  readonly errorCount: number;
  readonly lastCalledAt: string;
}

export interface ApiAiModel {
  readonly key: string;
  readonly modelId: string;
  readonly provider: string;
  readonly maxTokens: number;
  readonly temperature: number;
  readonly isActive: boolean;
}

export interface ApiAiUsage {
  readonly modelKey: string;
  readonly totalRequests: number;
  readonly totalTokens: number;
  readonly avgResponseMs: number;
  readonly errorRate: number;
  readonly costUsd: number;
}

export interface ApiProviderStatus {
  readonly channel: string;
  readonly provider: string;
  readonly apiHealthy: boolean;
  readonly lastHealthCheck: string;
  readonly credentials: "configured" | "missing" | "expired";
  readonly details: Record<string, unknown>;
}

export interface ApiPipelineStatus {
  readonly name: string;
  readonly description: string;
  readonly schedule: string;
  readonly lastRun: string | null;
  readonly nextRun: string;
  readonly status: "idle" | "running" | "succeeded" | "failed";
  readonly durationMs: number | null;
  readonly errorMessage: string | null;
}

export interface ApiChannelHealth {
  readonly channel: string;
  readonly provider: string;
  readonly status: "healthy" | "degraded" | "down";
  readonly deliveryRate: number;
  readonly messagesSentToday: number;
  readonly costToday: number;
  readonly lastCheckedAt: string;
  readonly details: Record<string, unknown>;
}

export interface ApiQueueDepth {
  readonly queue: string;
  readonly active: number;
  readonly waiting: number;
  readonly delayed: number;
  readonly failed: number;
  readonly completed: number;
  readonly processingRate: number;
}

export interface ApiDeployEntry {
  readonly id: string;
  readonly service: string;
  readonly commit: string;
  readonly deployer: string;
  readonly status: "success" | "failed" | "rolling_back" | "in_progress";
  readonly durationMs: number;
  readonly deployedAt: string;
  readonly environment: string;
}

export interface ApiServiceDeployStatus {
  readonly service: string;
  readonly status: "running" | "stopped" | "deploying";
  readonly version: string;
  readonly lastDeployedAt: string;
  readonly environment: string;
}

export interface ApiKeyResponse {
  readonly id: string;
  readonly name: string;
  readonly scopes: ReadonlyArray<string>;
  readonly createdAt: string;
  readonly expiresAt: string;
  readonly lastUsedAt: string | null;
  readonly isActive: boolean;
}

// --- Common ---

export interface TimeSeriesPoint {
  readonly time: string;
  readonly value: number;
}

export interface PaginatedResponse<T> {
  readonly data: ReadonlyArray<T>;
  readonly total: number;
  readonly page: number;
  readonly pageSize: number;
}
