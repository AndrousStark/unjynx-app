import { describe, it, expect } from "vitest";
import {
  slowQuerySchema,
  createApiKeySchema,
  rateLimitConfigSchema,
  aiModelConfigSchema,
  promptVersionSchema,
  deployQuerySchema,
  envVarSchema,
  backupActionSchema,
} from "../dev-portal.schema.js";

describe("dev-portal.schema", () => {
  // ── slowQuerySchema ─────────────────────────────────────────────
  describe("slowQuerySchema", () => {
    it("accepts valid input", () => {
      const result = slowQuerySchema.parse({ durationMs: 200, limit: 50 });
      expect(result.durationMs).toBe(200);
      expect(result.limit).toBe(50);
    });

    it("uses defaults when omitted", () => {
      const result = slowQuerySchema.parse({});
      expect(result.durationMs).toBe(100);
      expect(result.limit).toBe(25);
    });

    it("coerces string numbers", () => {
      const result = slowQuerySchema.parse({ durationMs: "500", limit: "10" });
      expect(result.durationMs).toBe(500);
      expect(result.limit).toBe(10);
    });

    it("rejects negative duration", () => {
      expect(() => slowQuerySchema.parse({ durationMs: -1 })).toThrow();
    });

    it("rejects limit over 100", () => {
      expect(() => slowQuerySchema.parse({ limit: 101 })).toThrow();
    });

    it("rejects limit of 0", () => {
      expect(() => slowQuerySchema.parse({ limit: 0 })).toThrow();
    });
  });

  // ── createApiKeySchema ──────────────────────────────────────────
  describe("createApiKeySchema", () => {
    it("accepts valid input", () => {
      const result = createApiKeySchema.parse({
        name: "Test Key",
        scopes: ["read:tasks", "write:tasks"],
        expiresInDays: 30,
      });
      expect(result.name).toBe("Test Key");
      expect(result.scopes).toEqual(["read:tasks", "write:tasks"]);
      expect(result.expiresInDays).toBe(30);
    });

    it("uses default expiry", () => {
      const result = createApiKeySchema.parse({
        name: "Default Expiry",
        scopes: ["read:all"],
      });
      expect(result.expiresInDays).toBe(90);
    });

    it("rejects empty name", () => {
      expect(() =>
        createApiKeySchema.parse({ name: "", scopes: ["read:all"] }),
      ).toThrow();
    });

    it("rejects empty scopes array", () => {
      expect(() =>
        createApiKeySchema.parse({ name: "Key", scopes: [] }),
      ).toThrow();
    });

    it("rejects expiry over 365 days", () => {
      expect(() =>
        createApiKeySchema.parse({
          name: "Key",
          scopes: ["read:all"],
          expiresInDays: 400,
        }),
      ).toThrow();
    });

    it("rejects name over 100 chars", () => {
      expect(() =>
        createApiKeySchema.parse({
          name: "x".repeat(101),
          scopes: ["read:all"],
        }),
      ).toThrow();
    });
  });

  // ── rateLimitConfigSchema ───────────────────────────────────────
  describe("rateLimitConfigSchema", () => {
    it("accepts valid config", () => {
      const result = rateLimitConfigSchema.parse({
        endpoint: "/api/v1/tasks",
        windowMs: 60000,
        maxRequests: 100,
      });
      expect(result.endpoint).toBe("/api/v1/tasks");
      expect(result.windowMs).toBe(60000);
      expect(result.maxRequests).toBe(100);
    });

    it("rejects window under 1000ms", () => {
      expect(() =>
        rateLimitConfigSchema.parse({
          endpoint: "/api/v1/tasks",
          windowMs: 500,
          maxRequests: 10,
        }),
      ).toThrow();
    });

    it("rejects zero max requests", () => {
      expect(() =>
        rateLimitConfigSchema.parse({
          endpoint: "/api/v1/tasks",
          windowMs: 60000,
          maxRequests: 0,
        }),
      ).toThrow();
    });
  });

  // ── aiModelConfigSchema ─────────────────────────────────────────
  describe("aiModelConfigSchema", () => {
    it("accepts valid anthropic config", () => {
      const result = aiModelConfigSchema.parse({
        modelId: "claude-haiku-4-5-20251001",
        provider: "anthropic",
        maxTokens: 4096,
        temperature: 0.7,
      });
      expect(result.provider).toBe("anthropic");
      expect(result.isActive).toBe(true);
    });

    it("accepts ollama config", () => {
      const result = aiModelConfigSchema.parse({
        modelId: "llama3.2:3b",
        provider: "ollama",
      });
      expect(result.provider).toBe("ollama");
      expect(result.maxTokens).toBe(4096);
      expect(result.temperature).toBe(0.7);
    });

    it("rejects invalid provider", () => {
      expect(() =>
        aiModelConfigSchema.parse({
          modelId: "gpt-4",
          provider: "openai",
        }),
      ).toThrow();
    });

    it("rejects temperature over 2", () => {
      expect(() =>
        aiModelConfigSchema.parse({
          modelId: "test",
          provider: "anthropic",
          temperature: 2.5,
        }),
      ).toThrow();
    });

    it("rejects maxTokens over 200000", () => {
      expect(() =>
        aiModelConfigSchema.parse({
          modelId: "test",
          provider: "anthropic",
          maxTokens: 300_000,
        }),
      ).toThrow();
    });
  });

  // ── promptVersionSchema ─────────────────────────────────────────
  describe("promptVersionSchema", () => {
    it("accepts valid prompt version", () => {
      const result = promptVersionSchema.parse({
        promptKey: "task_summary",
        content: "Summarize the following task: {task_title}",
        description: "Generate task summary",
      });
      expect(result.promptKey).toBe("task_summary");
    });

    it("accepts without description", () => {
      const result = promptVersionSchema.parse({
        promptKey: "greeting",
        content: "Hello {user_name}!",
      });
      expect(result.description).toBeUndefined();
    });

    it("rejects empty promptKey", () => {
      expect(() =>
        promptVersionSchema.parse({ promptKey: "", content: "test" }),
      ).toThrow();
    });

    it("rejects empty content", () => {
      expect(() =>
        promptVersionSchema.parse({ promptKey: "test", content: "" }),
      ).toThrow();
    });
  });

  // ── deployQuerySchema ───────────────────────────────────────────
  describe("deployQuerySchema", () => {
    it("accepts valid query", () => {
      const result = deployQuerySchema.parse({
        service: "backend",
        limit: 10,
      });
      expect(result.service).toBe("backend");
      expect(result.limit).toBe(10);
    });

    it("uses default limit", () => {
      const result = deployQuerySchema.parse({});
      expect(result.limit).toBe(20);
    });

    it("rejects limit over 50", () => {
      expect(() => deployQuerySchema.parse({ limit: 51 })).toThrow();
    });
  });

  // ── envVarSchema ────────────────────────────────────────────────
  describe("envVarSchema", () => {
    it("accepts valid env var", () => {
      const result = envVarSchema.parse({
        key: "DATABASE_URL",
        value: "postgres://localhost:5432/unjynx",
        environment: "development",
      });
      expect(result.environment).toBe("development");
    });

    it("rejects invalid environment", () => {
      expect(() =>
        envVarSchema.parse({
          key: "KEY",
          value: "val",
          environment: "test",
        }),
      ).toThrow();
    });
  });

  // ── backupActionSchema ──────────────────────────────────────────
  describe("backupActionSchema", () => {
    it("accepts trigger action", () => {
      const result = backupActionSchema.parse({ action: "trigger" });
      expect(result.action).toBe("trigger");
    });

    it("accepts verify action", () => {
      const result = backupActionSchema.parse({ action: "verify" });
      expect(result.action).toBe("verify");
    });

    it("rejects invalid action", () => {
      expect(() =>
        backupActionSchema.parse({ action: "delete" }),
      ).toThrow();
    });
  });
});
