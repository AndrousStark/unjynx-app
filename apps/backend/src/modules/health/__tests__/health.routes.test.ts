import { describe, it, expect, vi, beforeEach } from "vitest";
import { Hono } from "hono";
import { healthRoutes } from "../health.routes.js";

// Mock the database module
vi.mock("../../../db/index.js", () => ({
  db: {
    execute: vi.fn(),
  },
}));

import { db } from "../../../db/index.js";

describe("Health Routes", () => {
  const app = new Hono().route("/", healthRoutes);

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("GET /health", () => {
    it("returns 200 when database is healthy", async () => {
      vi.mocked(db.execute).mockResolvedValueOnce([] as never);

      const res = await app.request("/health");
      const body = await res.json();

      expect(res.status).toBe(200);
      expect(body.success).toBe(true);
      expect(body.data.status).toBe("ok");
      expect(body.data.database).toBe(true);
      expect(body.data.timestamp).toBeDefined();
      expect(body.data.uptime).toBeGreaterThanOrEqual(0);
    });

    it("returns 503 when database is down", async () => {
      vi.mocked(db.execute).mockRejectedValueOnce(
        new Error("Connection refused"),
      );

      const res = await app.request("/health");
      const body = await res.json();

      expect(res.status).toBe(503);
      expect(body.success).toBe(true);
      expect(body.data.database).toBe(false);
    });
  });

  describe("GET /metrics", () => {
    it("returns system metrics", async () => {
      const res = await app.request("/metrics");
      const body = await res.json();

      expect(res.status).toBe(200);
      expect(body.success).toBe(true);
      expect(body.data.uptime).toBeGreaterThanOrEqual(0);
      expect(body.data.memory).toBeDefined();
      expect(body.data.memory.heapUsed).toBeGreaterThan(0);
      expect(body.data.cpu).toBeDefined();
    });
  });
});
