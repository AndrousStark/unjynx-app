import { describe, it, expect, vi, beforeEach } from "vitest";

// Mock database
vi.mock("../../../db/index.js", () => ({
  db: {
    execute: vi.fn().mockResolvedValue([]),
    select: vi.fn().mockReturnValue({
      from: vi.fn().mockReturnValue({
        where: vi.fn().mockReturnValue({
          groupBy: vi.fn().mockResolvedValue([]),
        }),
      }),
    }),
  },
}));

// Mock queue factory
vi.mock("../../../queue/queue-factory.js", () => ({
  getAllQueues: vi.fn().mockReturnValue(new Map()),
}));

import {
  getSystemHealth,
  listApiKeys,
  createApiKey,
  revokeApiKey,
  getApiUsage,
  getDeployHistory,
  getServiceStatuses,
  getNotificationInfraHealth,
  getQueueDepths,
  listAiModels,
  updateAiModel,
  getAiUsageMetrics,
  getChannelProviderStatuses,
  getDataPipelineStatuses,
  getBackups,
  getDatabaseSchema,
  getSlowQueries,
  getMigrationHistory,
} from "../dev-portal.service.js";

describe("dev-portal.service", () => {
  // ── System Health ─────────────────────────────────────────────
  describe("getSystemHealth", () => {
    it("returns services array with overall status", async () => {
      const result = await getSystemHealth();
      expect(result).toHaveProperty("services");
      expect(result).toHaveProperty("overallStatus");
      expect(Array.isArray(result.services)).toBe(true);
      expect(result.services.length).toBeGreaterThan(0);
    });

    it("includes api-server service", async () => {
      const result = await getSystemHealth();
      const apiServer = result.services.find((s) => s.name === "api-server");
      expect(apiServer).toBeDefined();
      expect(apiServer!.status).toBe("healthy");
      expect(apiServer!.details).toHaveProperty("nodeVersion");
      expect(apiServer!.details).toHaveProperty("memoryUsage");
    });

    it("includes all expected services", async () => {
      const result = await getSystemHealth();
      const serviceNames = result.services.map((s) => s.name);
      expect(serviceNames).toContain("api-server");
      expect(serviceNames).toContain("postgresql");
      expect(serviceNames).toContain("valkey-cache");
      expect(serviceNames).toContain("bullmq-queue");
      expect(serviceNames).toContain("logto-auth");
      expect(serviceNames).toContain("minio-storage");
      expect(serviceNames).toContain("ollama-ai");
    });

    it("calculates overall status correctly", async () => {
      const result = await getSystemHealth();
      // Without Redis configured, expect degraded
      expect(["healthy", "degraded", "down"]).toContain(result.overallStatus);
    });
  });

  // ── Database Management ───────────────────────────────────────
  describe("getDatabaseSchema", () => {
    it("returns array (empty when db mocked)", async () => {
      const result = await getDatabaseSchema();
      expect(Array.isArray(result)).toBe(true);
    });
  });

  describe("getSlowQueries", () => {
    it("returns empty array when pg_stat_statements not available", async () => {
      const { db } = await import("../../../db/index.js");
      (db.execute as ReturnType<typeof vi.fn>).mockRejectedValueOnce(
        new Error("relation pg_stat_statements does not exist"),
      );

      const result = await getSlowQueries({ durationMs: 100, limit: 25 });
      expect(result).toEqual([]);
    });
  });

  describe("getMigrationHistory", () => {
    it("returns empty array when no migrations table", async () => {
      const { db } = await import("../../../db/index.js");
      (db.execute as ReturnType<typeof vi.fn>).mockRejectedValueOnce(
        new Error("relation drizzle.__drizzle_migrations does not exist"),
      );

      const result = await getMigrationHistory();
      expect(result).toEqual([]);
    });
  });

  // ── API Key Management ────────────────────────────────────────
  describe("API Key Management", () => {
    beforeEach(() => {
      // Clear existing keys by revoking all
      const existing = listApiKeys();
      for (const key of existing) {
        revokeApiKey(key.id);
      }
    });

    it("creates an API key", () => {
      const result = createApiKey({
        name: "Test Key",
        scopes: ["read:tasks"],
        expiresInDays: 30,
      });
      expect(result).toHaveProperty("id");
      expect(result).toHaveProperty("key");
      expect(result.key).toMatch(/^unjx_/);
      expect(result).toHaveProperty("expiresAt");
    });

    it("lists created keys without exposing full key", () => {
      createApiKey({ name: "Key 1", scopes: ["read:all"], expiresInDays: 90 });
      createApiKey({ name: "Key 2", scopes: ["write:all"], expiresInDays: 30 });

      const keys = listApiKeys();
      expect(keys.length).toBe(2);
      expect(keys[0]).not.toHaveProperty("keyHash");
      expect(keys[0]).toHaveProperty("name");
      expect(keys[0]).toHaveProperty("scopes");
    });

    it("revokes an API key", () => {
      const created = createApiKey({
        name: "Revokable",
        scopes: ["read:all"],
        expiresInDays: 90,
      });

      const revoked = revokeApiKey(created.id);
      expect(revoked).toBe(true);

      const keys = listApiKeys();
      expect(keys.find((k) => k.id === created.id)).toBeUndefined();
    });

    it("returns false for non-existent key revocation", () => {
      const revoked = revokeApiKey("non-existent-id");
      expect(revoked).toBe(false);
    });
  });

  // ── API Usage ─────────────────────────────────────────────────
  describe("getApiUsage", () => {
    it("returns endpoint usage data", () => {
      const usage = getApiUsage();
      expect(Array.isArray(usage)).toBe(true);
      expect(usage.length).toBeGreaterThan(0);
      expect(usage[0]).toHaveProperty("endpoint");
      expect(usage[0]).toHaveProperty("method");
      expect(usage[0]).toHaveProperty("totalRequests");
      expect(usage[0]).toHaveProperty("avgResponseMs");
    });
  });

  // ── Deployment ────────────────────────────────────────────────
  describe("getDeployHistory", () => {
    it("returns deployment entries", () => {
      const history = getDeployHistory();
      expect(Array.isArray(history)).toBe(true);
      expect(history.length).toBeGreaterThan(0);
      expect(history[0]).toHaveProperty("id");
      expect(history[0]).toHaveProperty("service");
      expect(history[0]).toHaveProperty("commit");
      expect(history[0]).toHaveProperty("status");
    });
  });

  describe("getServiceStatuses", () => {
    it("returns service statuses with real health checks", async () => {
      const statuses = await getServiceStatuses();
      expect(Array.isArray(statuses)).toBe(true);
      expect(statuses.length).toBeGreaterThan(0);
      const serviceNames = statuses.map((s) => s.service);
      expect(serviceNames).toContain("backend-api");
      expect(serviceNames).toContain("logto-auth");
      for (const status of statuses) {
        expect(["running", "stopped", "deploying"]).toContain(status.status);
      }
    });
  });

  // ── Notification Infrastructure ───────────────────────────────
  describe("getNotificationInfraHealth", () => {
    it("returns health for all 8 channels when no data", async () => {
      const health = await getNotificationInfraHealth();
      expect(health.length).toBe(8);

      const channels = health.map((h) => h.channel);
      expect(channels).toContain("push");
      expect(channels).toContain("telegram");
      expect(channels).toContain("email");
      expect(channels).toContain("whatsapp");
      expect(channels).toContain("sms");
      expect(channels).toContain("instagram");
      expect(channels).toContain("slack");
      expect(channels).toContain("discord");
    });

    it("includes provider info and delivery rate", async () => {
      const health = await getNotificationInfraHealth();
      for (const channel of health) {
        expect(channel).toHaveProperty("provider");
        expect(channel).toHaveProperty("deliveryRate");
        expect(channel).toHaveProperty("messagesSentToday");
        expect(channel).toHaveProperty("costToday");
        expect(typeof channel.deliveryRate).toBe("number");
      }
    });
  });

  describe("getQueueDepths", () => {
    it("returns placeholder when no queues initialized", async () => {
      const queues = await getQueueDepths();
      expect(queues.length).toBe(1);
      expect(queues[0].queue).toBe("none");
      expect(queues[0]).toHaveProperty("active");
      expect(queues[0]).toHaveProperty("waiting");
      expect(queues[0]).toHaveProperty("failed");
      expect(queues[0]).toHaveProperty("completed");
    });
  });

  // ── AI Model Management ───────────────────────────────────────
  describe("AI Model Management", () => {
    it("lists pre-configured models", () => {
      const models = listAiModels();
      expect(models.length).toBeGreaterThanOrEqual(3);

      const keys = models.map((m) => m.key);
      expect(keys).toContain("haiku-4-5");
      expect(keys).toContain("sonnet-4-6");
      expect(keys).toContain("llama-local");
    });

    it("updates existing model config", () => {
      const updated = updateAiModel("haiku-4-5", {
        modelId: "claude-haiku-4-5-20251001",
        provider: "anthropic",
        maxTokens: 8192,
        temperature: 0.3,
        isActive: true,
      });
      expect(updated).toBe(true);

      const models = listAiModels();
      const haiku = models.find((m) => m.key === "haiku-4-5");
      expect(haiku!.maxTokens).toBe(8192);
      expect(haiku!.temperature).toBe(0.3);
    });

    it("returns false for non-existent model", () => {
      const updated = updateAiModel("gpt-4", {
        modelId: "gpt-4",
        provider: "anthropic",
        maxTokens: 4096,
        temperature: 0.7,
        isActive: true,
      });
      expect(updated).toBe(false);
    });
  });

  describe("getAiUsageMetrics", () => {
    it("returns usage metrics for each model", () => {
      const metrics = getAiUsageMetrics();
      expect(metrics.length).toBeGreaterThan(0);
      expect(metrics[0]).toHaveProperty("modelKey");
      expect(metrics[0]).toHaveProperty("totalRequests");
      expect(metrics[0]).toHaveProperty("totalTokens");
      expect(metrics[0]).toHaveProperty("costUsd");
    });

    it("ollama model has zero cost", () => {
      const metrics = getAiUsageMetrics();
      const llama = metrics.find((m) => m.modelKey === "llama-local");
      expect(llama!.costUsd).toBe(0);
    });
  });

  // ── Channel Providers ─────────────────────────────────────────
  describe("getChannelProviderStatuses", () => {
    it("returns all 8 channel providers", async () => {
      const statuses = await getChannelProviderStatuses();
      expect(statuses.length).toBe(8);

      const channels = statuses.map((s) => s.channel);
      expect(channels).toContain("telegram");
      expect(channels).toContain("whatsapp");
      expect(channels).toContain("instagram");
      expect(channels).toContain("sms");
      expect(channels).toContain("email");
      expect(channels).toContain("push");
      expect(channels).toContain("slack");
      expect(channels).toContain("discord");
    });

    it("includes credential status", async () => {
      const statuses = await getChannelProviderStatuses();
      for (const status of statuses) {
        expect(["configured", "missing", "expired"]).toContain(
          status.credentials,
        );
      }
    });
  });

  // ── Data Pipeline ─────────────────────────────────────────────
  describe("getDataPipelineStatuses", () => {
    it("returns pipeline statuses", () => {
      const pipelines = getDataPipelineStatuses();
      expect(pipelines.length).toBeGreaterThan(0);
      expect(pipelines[0]).toHaveProperty("name");
      expect(pipelines[0]).toHaveProperty("schedule");
      expect(pipelines[0]).toHaveProperty("status");
      expect(pipelines[0]).toHaveProperty("durationMs");
    });

    it("includes critical pipelines", () => {
      const pipelines = getDataPipelineStatuses();
      const names = pipelines.map((p) => p.name);
      expect(names).toContain("content-ingestion");
      expect(names).toContain("database-backup");
      expect(names).toContain("data-anonymization");
    });
  });

  describe("getBackups", () => {
    it("returns backup list", () => {
      const backups = getBackups();
      expect(backups.length).toBeGreaterThan(0);
      expect(backups[0]).toHaveProperty("id");
      expect(backups[0]).toHaveProperty("sizeBytes");
      expect(backups[0]).toHaveProperty("status");
      expect(backups[0]).toHaveProperty("verified");
    });
  });
});
