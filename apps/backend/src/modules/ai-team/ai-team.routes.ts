import { Hono } from "hono";
import { z } from "zod";
import { zValidator } from "@hono/zod-validator";
import { authMiddleware } from "../../middleware/auth.js";
import { tenantMiddleware, requireOrgRole } from "../../middleware/tenant.js";
import { ok, err } from "../../types/api.js";
import * as aiTeamService from "./ai-team.service.js";

export const aiTeamRoutes = new Hono();

aiTeamRoutes.use("/*", authMiddleware);
aiTeamRoutes.use("/*", tenantMiddleware);

// ── Daily Standup Summary ────────────────────────────────────────────

// GET /ai-team/standup — Generate daily standup summary
aiTeamRoutes.get("/standup", async (c) => {
  const tenant = c.get("tenant");
  if (!tenant.orgId) return c.json(err("Organization context required"), 400);

  const summary = await aiTeamService.generateStandupSummary(tenant.orgId);
  return c.json(ok(summary));
});

// ── Risk Detection ───────────────────────────────────────────────────

// GET /ai-team/risks — Detect project risks
aiTeamRoutes.get("/risks", async (c) => {
  const tenant = c.get("tenant");
  if (!tenant.orgId) return c.json(err("Organization context required"), 400);

  const report = await aiTeamService.detectRisks(tenant.orgId);
  return c.json(ok(report));
});

// ── Smart Assignment ─────────────────────────────────────────────────

// POST /ai-team/suggest-assignee — Suggest who should work on a task
aiTeamRoutes.post(
  "/suggest-assignee",
  zValidator("json", z.object({
    taskTitle: z.string().min(1).max(500),
    taskPriority: z.string().default("medium"),
  })),
  async (c) => {
    const tenant = c.get("tenant");
    if (!tenant.orgId) return c.json(err("Organization context required"), 400);

    const { taskTitle, taskPriority } = c.req.valid("json");
    const suggestions = await aiTeamService.suggestAssignee(tenant.orgId, taskTitle, taskPriority);
    return c.json(ok(suggestions));
  },
);

// ── Project Health ───────────────────────────────────────────────────

// GET /ai-team/health/:projectId — Get project health score
aiTeamRoutes.get("/health/:projectId", async (c) => {
  const tenant = c.get("tenant");
  if (!tenant.orgId) return c.json(err("Organization context required"), 400);

  const health = await aiTeamService.getProjectHealth(
    tenant.orgId,
    c.req.param("projectId"),
  );
  return c.json(ok(health));
});

// ── Suggestions ──────────────────────────────────────────────────────

// GET /ai-team/suggestions — List pending AI suggestions
aiTeamRoutes.get(
  "/suggestions",
  zValidator("query", z.object({
    entityType: z.string().optional(),
    entityId: z.string().uuid().optional(),
  })),
  async (c) => {
    const tenant = c.get("tenant");
    if (!tenant.orgId) return c.json(err("Organization context required"), 400);

    const { entityType, entityId } = c.req.valid("query");
    const suggestions = await aiTeamService.getPendingSuggestions(
      tenant.orgId,
      entityType,
      entityId,
    );
    return c.json(ok(suggestions));
  },
);

// POST /ai-team/suggestions/:id/accept — Accept a suggestion
aiTeamRoutes.post("/suggestions/:id/accept", async (c) => {
  await aiTeamService.acceptSuggestion(c.req.param("id"));
  return c.json(ok({ accepted: true }));
});

// POST /ai-team/suggestions/:id/dismiss — Dismiss a suggestion
aiTeamRoutes.post("/suggestions/:id/dismiss", async (c) => {
  await aiTeamService.dismissSuggestion(c.req.param("id"));
  return c.json(ok({ dismissed: true }));
});

// ── Operations History & Cost ────────────────────────────────────────

// GET /ai-team/operations — AI operation history
aiTeamRoutes.get(
  "/operations",
  requireOrgRole("admin"),
  zValidator("query", z.object({
    operationType: z.string().optional(),
    limit: z.coerce.number().int().min(1).max(100).default(20),
  })),
  async (c) => {
    const tenant = c.get("tenant");
    if (!tenant.orgId) return c.json(err("Organization context required"), 400);

    const { operationType, limit } = c.req.valid("query");
    const history = await aiTeamService.getOperationHistory(tenant.orgId, { operationType, limit });
    return c.json(ok(history));
  },
);

// GET /ai-team/cost — AI cost summary (last 30 days)
aiTeamRoutes.get(
  "/cost",
  requireOrgRole("admin"),
  async (c) => {
    const tenant = c.get("tenant");
    if (!tenant.orgId) return c.json(err("Organization context required"), 400);

    const cost = await aiTeamService.getAiCostSummary(tenant.orgId);
    return c.json(ok(cost));
  },
);
