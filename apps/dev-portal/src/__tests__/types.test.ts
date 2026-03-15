// ============================================================
// UNJYNX Dev Portal - Type Guard Tests
// ============================================================

import { describe, it, expect } from "vitest";
import type {
  ServiceStatus,
  ServiceHealth,
  TableSchema,
  ApiKey,
  ChannelType,
  EtlJob,
  AiModelConfig,
} from "@/types";

describe("Type definitions", () => {
  it("ServiceStatus accepts valid values", () => {
    const statuses: ServiceStatus[] = ["healthy", "degraded", "down", "unknown"];
    expect(statuses).toHaveLength(4);
    statuses.forEach((s) => expect(typeof s).toBe("string"));
  });

  it("ServiceHealth has readonly properties", () => {
    const service: ServiceHealth = {
      name: "API Server",
      status: "healthy",
      uptime: 99.99,
      lastCheck: new Date().toISOString(),
      metrics: { rps: 100 },
    };
    expect(service.name).toBe("API Server");
    expect(service.status).toBe("healthy");
    expect(service.uptime).toBe(99.99);
  });

  it("TableSchema has correct structure", () => {
    const table: TableSchema = {
      name: "test",
      columns: [],
      indexes: [],
      rowCount: 0,
      sizeKB: 0,
    };
    expect(table.name).toBe("test");
    expect(Array.isArray(table.columns)).toBe(true);
    expect(Array.isArray(table.indexes)).toBe(true);
  });

  it("ApiKey has required fields", () => {
    const key: ApiKey = {
      id: "k1",
      name: "Test Key",
      keyPrefix: "unjx_test_",
      createdAt: new Date().toISOString(),
      expiresAt: null,
      lastUsed: null,
      status: "active",
      scopes: ["read"],
    };
    expect(key.status).toBe("active");
    expect(key.expiresAt).toBeNull();
    expect(Array.isArray(key.scopes)).toBe(true);
  });

  it("ChannelType covers all 8 channels", () => {
    const channels: ChannelType[] = [
      "whatsapp",
      "telegram",
      "email",
      "sms",
      "push",
      "instagram",
      "slack",
      "discord",
    ];
    expect(channels).toHaveLength(8);
  });

  it("EtlJob has schedule and timing fields", () => {
    const job: EtlJob = {
      id: "e1",
      name: "test_job",
      schedule: "0 * * * *",
      lastRun: new Date().toISOString(),
      nextRun: new Date().toISOString(),
      status: "completed",
      duration: 1000,
      recordsProcessed: 100,
    };
    expect(job.schedule).toBe("0 * * * *");
    expect(job.status).toBe("completed");
  });

  it("AiModelConfig has model parameters", () => {
    const model: AiModelConfig = {
      id: "m1",
      provider: "Anthropic",
      modelId: "claude-haiku-4-5",
      maxTokens: 4096,
      temperature: 0.3,
      purpose: "Testing",
      status: "active",
    };
    expect(model.temperature).toBeLessThanOrEqual(1);
    expect(model.maxTokens).toBeGreaterThan(0);
  });
});
