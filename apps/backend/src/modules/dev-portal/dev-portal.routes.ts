// ── Dev Portal Routes ───────────────────────────────────────────────
// Engineering-focused API endpoints for system monitoring, database
// management, API management, deployment, notification infra, AI models,
// channel providers, and data pipeline status.

import { Hono } from "hono";
import { zValidator } from "@hono/zod-validator";
import { authMiddleware } from "../../middleware/auth.js";
import { adminGuard } from "../../middleware/admin-guard.js";
import { ok, err } from "../../types/api.js";
import {
  slowQuerySchema,
  createApiKeySchema,
  aiModelConfigSchema,
} from "./dev-portal.schema.js";
import * as devService from "./dev-portal.service.js";

export const devPortalRoutes = new Hono();

// All dev portal routes require auth + admin role
devPortalRoutes.use("/*", authMiddleware);
devPortalRoutes.use("/*", adminGuard("super_admin", "dev_admin"));

// ── R1: System Health ───────────────────────────────────────────────

// GET /dev/health - Full system health status
devPortalRoutes.get("/health", async (c) => {
  const health = await devService.getSystemHealth();
  return c.json(ok(health));
});

// ── R2: Database Management ─────────────────────────────────────────

// GET /dev/database/schema - Database schema overview
devPortalRoutes.get("/database/schema", async (c) => {
  const schema = await devService.getDatabaseSchema();
  return c.json(ok(schema));
});

// GET /dev/database/slow-queries - Slow query log
devPortalRoutes.get(
  "/database/slow-queries",
  zValidator("query", slowQuerySchema),
  async (c) => {
    const query = c.req.valid("query");
    const queries = await devService.getSlowQueries(query);
    return c.json(ok(queries));
  },
);

// GET /dev/database/migrations - Migration history
devPortalRoutes.get("/database/migrations", async (c) => {
  const migrations = await devService.getMigrationHistory();
  return c.json(ok(migrations));
});

// GET /dev/database/backups - List backups
devPortalRoutes.get("/database/backups", async (c) => {
  const backups = await devService.getBackups();
  return c.json(ok(backups));
});

// ── R3: API Management ──────────────────────────────────────────────

// GET /dev/api-keys - List API keys
devPortalRoutes.get("/api-keys", async (c) => {
  const keys = devService.listApiKeys();
  return c.json(ok(keys));
});

// POST /dev/api-keys - Create API key
devPortalRoutes.post(
  "/api-keys",
  zValidator("json", createApiKeySchema),
  async (c) => {
    const input = c.req.valid("json");
    const result = devService.createApiKey(input);
    return c.json(ok(result), 201);
  },
);

// DELETE /dev/api-keys/:id - Revoke API key
devPortalRoutes.delete("/api-keys/:id", async (c) => {
  const keyId = c.req.param("id");
  const revoked = devService.revokeApiKey(keyId);

  if (!revoked) {
    return c.json(err("API key not found"), 404);
  }

  return c.json(ok({ revoked: true }));
});

// GET /dev/api-usage - API usage analytics
devPortalRoutes.get("/api-usage", async (c) => {
  const usage = devService.getApiUsage();
  return c.json(ok(usage));
});

// ── R4: Deployment ──────────────────────────────────────────────────

// GET /dev/deployments - Deploy history
devPortalRoutes.get("/deployments", async (c) => {
  const history = devService.getDeployHistory();
  return c.json(ok(history));
});

// GET /dev/services - Service statuses
devPortalRoutes.get("/services", async (c) => {
  const statuses = await devService.getServiceStatuses();
  return c.json(ok(statuses));
});

// ── R5: Notification Infrastructure ─────────────────────────────────

// GET /dev/notifications/health - Channel health
devPortalRoutes.get("/notifications/health", async (c) => {
  const health = await devService.getNotificationInfraHealth();
  return c.json(ok(health));
});

// GET /dev/notifications/queues - Queue depths
devPortalRoutes.get("/notifications/queues", async (c) => {
  const queues = await devService.getQueueDepths();
  return c.json(ok(queues));
});

// ── R6: AI Model Management ────────────────────────────────────────

// GET /dev/ai-models - List AI models
devPortalRoutes.get("/ai-models", async (c) => {
  const models = devService.listAiModels();
  return c.json(ok(models));
});

// PATCH /dev/ai-models/:key - Update model config
devPortalRoutes.patch(
  "/ai-models/:key",
  zValidator("json", aiModelConfigSchema),
  async (c) => {
    const key = c.req.param("key");
    const config = c.req.valid("json");
    const updated = devService.updateAiModel(key, config);

    if (!updated) {
      return c.json(err("Model not found"), 404);
    }

    return c.json(ok({ updated: true }));
  },
);

// GET /dev/ai-usage - AI usage metrics
devPortalRoutes.get("/ai-usage", async (c) => {
  const metrics = devService.getAiUsageMetrics();
  return c.json(ok(metrics));
});

// ── R7: Channel Providers ───────────────────────────────────────────

// GET /dev/channel-providers - Provider statuses
devPortalRoutes.get("/channel-providers", async (c) => {
  const statuses = await devService.getChannelProviderStatuses();
  return c.json(ok(statuses));
});

// ── R8: Data Pipeline ───────────────────────────────────────────────

// GET /dev/pipelines - Pipeline statuses
devPortalRoutes.get("/pipelines", async (c) => {
  const pipelines = devService.getDataPipelineStatuses();
  return c.json(ok(pipelines));
});

// GET /dev/pipelines/backups - Backup info
devPortalRoutes.get("/pipelines/backups", async (c) => {
  const backups = devService.getBackups();
  return c.json(ok(backups));
});
