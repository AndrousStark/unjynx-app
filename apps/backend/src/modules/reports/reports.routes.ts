import { Hono } from "hono";
import { z } from "zod";
import { zValidator } from "@hono/zod-validator";
import { authMiddleware } from "../../middleware/auth.js";
import { tenantMiddleware, requireOrgRole } from "../../middleware/tenant.js";
import { ok, err } from "../../types/api.js";
import * as reportsService from "./reports.service.js";

export const reportRoutes = new Hono();

reportRoutes.use("/*", authMiddleware);
reportRoutes.use("/*", tenantMiddleware);

// ── Query Schemas ────────────────────────────────────────────────────

const projectQuerySchema = z.object({
  projectId: z.string().uuid(),
  limit: z.coerce.number().int().min(1).max(50).default(10),
});

const periodQuerySchema = z.object({
  projectId: z.string().uuid().optional(),
  days: z.coerce.number().int().min(1).max(365).default(30),
});

// ── Sprint Velocity ──────────────────────────────────────────────────

// GET /reports/velocity?projectId=&limit=
reportRoutes.get(
  "/velocity",
  zValidator("query", projectQuerySchema),
  async (c) => {
    const tenant = c.get("tenant");
    if (!tenant.orgId) return c.json(err("Organization context required"), 400);

    const { projectId, limit } = c.req.valid("query");
    const data = await reportsService.getSprintVelocity(tenant.orgId, projectId, limit);
    return c.json(ok(data));
  },
);

// ── Cycle Time ───────────────────────────────────────────────────────

// GET /reports/cycle-time?projectId=&days=
reportRoutes.get(
  "/cycle-time",
  zValidator("query", periodQuerySchema),
  async (c) => {
    const tenant = c.get("tenant");
    if (!tenant.orgId) return c.json(err("Organization context required"), 400);

    const { projectId, days } = c.req.valid("query");
    const data = await reportsService.getCycleTime(tenant.orgId, projectId, days);
    return c.json(ok(data));
  },
);

// ── Team Workload ────────────────────────────────────────────────────

// GET /reports/workload?projectId=
reportRoutes.get(
  "/workload",
  zValidator("query", z.object({ projectId: z.string().uuid().optional() })),
  async (c) => {
    const tenant = c.get("tenant");
    if (!tenant.orgId) return c.json(err("Organization context required"), 400);

    const { projectId } = c.req.valid("query");
    const data = await reportsService.getTeamWorkload(tenant.orgId, projectId);
    return c.json(ok(data));
  },
);

// ── SLA Compliance ───────────────────────────────────────────────────

// GET /reports/sla?projectId=&days=
reportRoutes.get(
  "/sla",
  zValidator("query", periodQuerySchema),
  async (c) => {
    const tenant = c.get("tenant");
    if (!tenant.orgId) return c.json(err("Organization context required"), 400);

    const { projectId, days } = c.req.valid("query");
    const data = await reportsService.getSlaCompliance(tenant.orgId, projectId, days);
    return c.json(ok(data));
  },
);

// ── Org Summary ──────────────────────────────────────────────────────

// GET /reports/summary — Top-level org KPIs
reportRoutes.get("/summary", async (c) => {
  const tenant = c.get("tenant");
  if (!tenant.orgId) return c.json(err("Organization context required"), 400);

  const data = await reportsService.getOrgSummary(tenant.orgId);
  return c.json(ok(data));
});

// ── Snapshots ────────────────────────────────────────────────────────

// GET /reports/snapshots?reportType=&projectId=&limit=
reportRoutes.get(
  "/snapshots",
  zValidator("query", z.object({
    reportType: z.string().min(1),
    projectId: z.string().uuid().optional(),
    limit: z.coerce.number().int().min(1).max(50).default(10),
  })),
  async (c) => {
    const tenant = c.get("tenant");
    if (!tenant.orgId) return c.json(err("Organization context required"), 400);

    const { reportType, projectId, limit } = c.req.valid("query");
    const data = await reportsService.getSnapshots(tenant.orgId, reportType, projectId, limit);
    return c.json(ok(data));
  },
);

// POST /reports/snapshots — Save a snapshot (admin+)
reportRoutes.post(
  "/snapshots",
  requireOrgRole("admin"),
  zValidator("json", z.object({
    reportType: z.string().min(1).max(50),
    data: z.record(z.unknown()),
    projectId: z.string().uuid().optional(),
    periodStart: z.string().datetime().optional(),
    periodEnd: z.string().datetime().optional(),
  })),
  async (c) => {
    const tenant = c.get("tenant");
    if (!tenant.orgId) return c.json(err("Organization context required"), 400);

    const input = c.req.valid("json");
    const snapshot = await reportsService.saveSnapshot(
      tenant.orgId,
      input.reportType,
      input.data,
      input.projectId,
      input.periodStart ? new Date(input.periodStart) : undefined,
      input.periodEnd ? new Date(input.periodEnd) : undefined,
    );
    return c.json(ok(snapshot), 201);
  },
);
