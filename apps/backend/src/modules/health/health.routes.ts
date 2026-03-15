import { Hono } from "hono";
import { db } from "../../db/index.js";
import { sql } from "drizzle-orm";
import { ok } from "../../types/api.js";

export const healthRoutes = new Hono();

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

healthRoutes.get("/metrics", (c) => {
  const metrics = {
    uptime: process.uptime(),
    memory: process.memoryUsage(),
    cpu: process.cpuUsage(),
  };

  return c.json(ok(metrics));
});
