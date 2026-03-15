import { z } from "zod";

// ── System Health ───────────────────────────────────────────────────

export const serviceStatusSchema = z.object({
  name: z.string(),
  status: z.enum(["healthy", "degraded", "down"]),
  uptime: z.number(),
  responseTimeMs: z.number(),
  errorRate: z.number(),
  details: z.record(z.string(), z.unknown()).optional(),
});

export type ServiceStatus = z.infer<typeof serviceStatusSchema>;

// ── Database ────────────────────────────────────────────────────────

export const slowQuerySchema = z.object({
  durationMs: z.coerce.number().min(0).default(100),
  limit: z.coerce.number().min(1).max(100).default(25),
});

export type SlowQueryInput = z.infer<typeof slowQuerySchema>;

export const backupActionSchema = z.object({
  action: z.enum(["trigger", "verify"]),
});

export type BackupAction = z.infer<typeof backupActionSchema>;

// ── API Management ──────────────────────────────────────────────────

export const createApiKeySchema = z.object({
  name: z.string().min(1).max(100),
  scopes: z.array(z.string()).min(1),
  expiresInDays: z.number().min(1).max(365).default(90),
});

export type CreateApiKeyInput = z.infer<typeof createApiKeySchema>;

export const rateLimitConfigSchema = z.object({
  endpoint: z.string(),
  windowMs: z.number().min(1000),
  maxRequests: z.number().min(1),
});

export type RateLimitConfig = z.infer<typeof rateLimitConfigSchema>;

// ── Deployment ──────────────────────────────────────────────────────

export const deployQuerySchema = z.object({
  service: z.string().optional(),
  limit: z.coerce.number().min(1).max(50).default(20),
});

export type DeployQuery = z.infer<typeof deployQuerySchema>;

export const envVarSchema = z.object({
  key: z.string().min(1).max(100),
  value: z.string(),
  environment: z.enum(["development", "staging", "production"]),
});

export type EnvVarInput = z.infer<typeof envVarSchema>;

// ── AI Model Config ─────────────────────────────────────────────────

export const aiModelConfigSchema = z.object({
  modelId: z.string().min(1),
  provider: z.enum(["anthropic", "ollama"]),
  maxTokens: z.number().min(1).max(200_000).default(4096),
  temperature: z.number().min(0).max(2).default(0.7),
  isActive: z.boolean().default(true),
});

export type AiModelConfig = z.infer<typeof aiModelConfigSchema>;

export const promptVersionSchema = z.object({
  promptKey: z.string().min(1),
  content: z.string().min(1),
  description: z.string().optional(),
});

export type PromptVersionInput = z.infer<typeof promptVersionSchema>;

// ── Data Pipeline ───────────────────────────────────────────────────

export const pipelineJobSchema = z.object({
  name: z.string(),
  schedule: z.string(),
  lastRun: z.string().nullable(),
  nextRun: z.string().nullable(),
  status: z.enum(["idle", "running", "succeeded", "failed"]),
  durationMs: z.number().nullable(),
});

export type PipelineJob = z.infer<typeof pipelineJobSchema>;
