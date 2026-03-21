import { describe, it, expect, vi, beforeEach } from "vitest";

// ── Mock Helpers ──────────────────────────────────────────────────────
// Build a fluent query chain that supports all Drizzle methods used by
// the service. Each method returns `chain` so calls can be chained in
// any order, and the final awaitable resolves via `.then()`.

function createChain(resolvedValue: unknown = []) {
  const chain: Record<string, ReturnType<typeof vi.fn>> & {
    then: (fn: (v: unknown) => unknown) => unknown;
  } = {} as never;

  const self = () => chain;
  chain.from = vi.fn(self);
  chain.where = vi.fn(self);
  chain.groupBy = vi.fn(self);
  chain.orderBy = vi.fn(self);
  chain.limit = vi.fn(self);
  chain.set = vi.fn(self);
  chain.values = vi.fn(self);
  chain.returning = vi.fn().mockResolvedValue(resolvedValue);
  chain.then = (fn: (v: unknown) => unknown) =>
    Promise.resolve(resolvedValue).then(fn);
  return chain;
}

// Mock database
vi.mock("../../../db/index.js", () => {
  const selectChain = createChain([]);
  const insertChain = createChain([{ id: "mock-id" }]);
  const updateChain = createChain([]);

  return {
    db: {
      execute: vi.fn().mockResolvedValue([]),
      select: vi.fn().mockReturnValue(selectChain),
      insert: vi.fn().mockReturnValue(insertChain),
      update: vi.fn().mockReturnValue(updateChain),
    },
  };
});

// Mock queue factory
vi.mock("../../../queue/queue-factory.js", () => ({
  getAllQueues: vi.fn().mockReturnValue(new Map()),
}));

import { db } from "../../../db/index.js";
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
  beforeEach(() => {
    vi.clearAllMocks();
  });

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
      (db.execute as ReturnType<typeof vi.fn>).mockRejectedValueOnce(
        new Error("relation pg_stat_statements does not exist"),
      );

      const result = await getSlowQueries({ durationMs: 100, limit: 25 });
      expect(result).toEqual([]);
    });
  });

  describe("getMigrationHistory", () => {
    it("returns empty array when no migrations table", async () => {
      (db.execute as ReturnType<typeof vi.fn>).mockRejectedValueOnce(
        new Error("relation drizzle.__drizzle_migrations does not exist"),
      );

      const result = await getMigrationHistory();
      expect(result).toEqual([]);
    });
  });

  // ── API Key Management ────────────────────────────────────────
  describe("API Key Management", () => {
    it("creates an API key and returns id, key, expiresAt", async () => {
      // Mock the insert chain to return an id
      const insertChain = createChain([{ id: "new-key-id" }]);
      (db.insert as ReturnType<typeof vi.fn>).mockReturnValueOnce(insertChain);

      const result = await createApiKey({
        name: "Test Key",
        scopes: ["read:tasks"],
        expiresInDays: 30,
      });
      expect(result).toHaveProperty("id");
      expect(result).toHaveProperty("key");
      expect(result.key).toMatch(/^unjx_/);
      expect(result).toHaveProperty("expiresAt");
    });

    it("lists active keys from database", async () => {
      const mockRows = [
        {
          id: "k1",
          name: "Key 1",
          keyPrefix: "unjx_abc123",
          scopes: ["read:all"],
          createdAt: new Date(),
          expiresAt: new Date(),
          lastUsedAt: null,
          isActive: true,
        },
      ];
      const selectChain = createChain(mockRows);
      (db.select as ReturnType<typeof vi.fn>).mockReturnValueOnce(selectChain);

      const keys = await listApiKeys();
      expect(keys.length).toBe(1);
      expect(keys[0]).toHaveProperty("name");
      expect(keys[0]).toHaveProperty("scopes");
      expect(keys[0]).toHaveProperty("keyPrefix");
    });

    it("revokes an API key via soft-delete", async () => {
      const updateChain = createChain([{ id: "k1" }]);
      (db.update as ReturnType<typeof vi.fn>).mockReturnValueOnce(updateChain);

      const revoked = await revokeApiKey("k1");
      expect(revoked).toBe(true);
    });

    it("returns false for non-existent key revocation", async () => {
      const updateChain = createChain([]);
      (db.update as ReturnType<typeof vi.fn>).mockReturnValueOnce(updateChain);

      const revoked = await revokeApiKey("non-existent-id");
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
    it("returns empty array when no GITHUB_PAT configured", async () => {
      // Without GITHUB_PAT in env, should return empty
      const original = process.env.GITHUB_PAT;
      delete process.env.GITHUB_PAT;

      const history = await getDeployHistory();
      expect(Array.isArray(history)).toBe(true);
      expect(history.length).toBe(0);

      // Restore
      if (original) process.env.GITHUB_PAT = original;
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
    it("lists models from database", async () => {
      const mockRows = [
        {
          key: "haiku-4-5",
          modelId: "claude-haiku-4-5-20251001",
          provider: "anthropic",
          maxTokens: 4096,
          temperature: 0.7,
          isActive: true,
          updatedAt: new Date(),
        },
        {
          key: "sonnet-4-6",
          modelId: "claude-sonnet-4-6",
          provider: "anthropic",
          maxTokens: 8192,
          temperature: 0.5,
          isActive: true,
          updatedAt: new Date(),
        },
      ];
      const selectChain = createChain(mockRows);
      (db.select as ReturnType<typeof vi.fn>).mockReturnValueOnce(selectChain);

      const models = await listAiModels();
      expect(models.length).toBe(2);
      const keys = models.map((m) => m.key);
      expect(keys).toContain("haiku-4-5");
      expect(keys).toContain("sonnet-4-6");
    });

    it("updates existing model config", async () => {
      const updateChain = createChain([{ key: "haiku-4-5" }]);
      (db.update as ReturnType<typeof vi.fn>).mockReturnValueOnce(updateChain);

      const updated = await updateAiModel("haiku-4-5", {
        modelId: "claude-haiku-4-5-20251001",
        provider: "anthropic",
        maxTokens: 8192,
        temperature: 0.3,
        isActive: true,
      });
      expect(updated).toBe(true);
    });

    it("returns false for non-existent model", async () => {
      const updateChain = createChain([]);
      (db.update as ReturnType<typeof vi.fn>).mockReturnValueOnce(updateChain);

      const updated = await updateAiModel("gpt-4", {
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
    it("returns zero-usage metrics from active models", async () => {
      const mockModels = [
        { key: "haiku-4-5" },
        { key: "sonnet-4-6" },
      ];
      const selectChain = createChain(mockModels);
      (db.select as ReturnType<typeof vi.fn>).mockReturnValueOnce(selectChain);

      const metrics = await getAiUsageMetrics();
      expect(metrics.length).toBe(2);
      expect(metrics[0]).toHaveProperty("modelKey");
      expect(metrics[0]).toHaveProperty("totalRequests");
      expect(metrics[0].totalRequests).toBe(0);
      expect(metrics[0].costUsd).toBe(0);
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
    it("returns all pipeline definitions even when table is empty", async () => {
      const selectChain = createChain([]);
      (db.select as ReturnType<typeof vi.fn>).mockReturnValueOnce(selectChain);

      const pipelines = await getDataPipelineStatuses();
      expect(pipelines.length).toBeGreaterThan(0);
      expect(pipelines[0]).toHaveProperty("name");
      expect(pipelines[0]).toHaveProperty("schedule");
      expect(pipelines[0]).toHaveProperty("status");
    });

    it("includes critical pipelines", async () => {
      const selectChain = createChain([]);
      (db.select as ReturnType<typeof vi.fn>).mockReturnValueOnce(selectChain);

      const pipelines = await getDataPipelineStatuses();
      const names = pipelines.map((p) => p.name);
      expect(names).toContain("content-ingestion");
      expect(names).toContain("database-backup");
      expect(names).toContain("data-anonymization");
    });
  });

  describe("getBackups", () => {
    it("returns empty array when no backup runs exist", async () => {
      const selectChain = createChain([]);
      (db.select as ReturnType<typeof vi.fn>).mockReturnValueOnce(selectChain);

      const backups = await getBackups();
      expect(Array.isArray(backups)).toBe(true);
      expect(backups.length).toBe(0);
    });

    it("maps pipeline_runs rows to backup entries", async () => {
      const mockRows = [
        {
          id: "bak-1",
          status: "completed",
          startedAt: new Date("2026-03-20T03:00:00Z"),
          completedAt: new Date("2026-03-20T03:02:00Z"),
          itemsProcessed: 52_428_800,
          errorMessage: null,
        },
      ];
      const selectChain = createChain(mockRows);
      (db.select as ReturnType<typeof vi.fn>).mockReturnValueOnce(selectChain);

      const backups = await getBackups();
      expect(backups.length).toBe(1);
      expect(backups[0]).toHaveProperty("id");
      expect(backups[0]).toHaveProperty("sizeBytes");
      expect(backups[0]).toHaveProperty("status");
      expect(backups[0]).toHaveProperty("verified");
      expect(backups[0].status).toBe("completed");
      expect(backups[0].verified).toBe(true);
      expect(backups[0].sizeBytes).toBe(52_428_800);
    });
  });
});
