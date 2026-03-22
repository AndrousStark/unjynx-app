import { Hono } from "hono";
import { db } from "../../db/index.js";
import { sql } from "drizzle-orm";
import { ok, err } from "../../types/api.js";
import { authMiddleware } from "../../middleware/auth.js";
import { adminGuard } from "../../middleware/admin-guard.js";

export const healthRoutes = new Hono();

// Health check: public (load balancers, uptime monitors)
healthRoutes.get("/health", async (c) => {
  const checks = {
    status: "ok" as const,
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    database: false,
  };

  try {
    await db.execute(sql`SELECT 1`);
    checks.database = true;
  } catch {
    checks.database = false;
  }

  const isHealthy = checks.database;

  return c.json(ok(checks), isHealthy ? 200 : 503);
});

// Metrics: admin-only (exposes internal process info)
healthRoutes.get("/metrics", authMiddleware, adminGuard("super_admin", "dev_admin"), (c) => {
  const metrics = {
    uptime: process.uptime(),
    memory: process.memoryUsage(),
    cpu: process.cpuUsage(),
  };

  return c.json(ok(metrics));
});
