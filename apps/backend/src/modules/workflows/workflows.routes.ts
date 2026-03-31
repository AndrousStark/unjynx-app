import { Hono } from "hono";
import { z } from "zod";
import { zValidator } from "@hono/zod-validator";
import { authMiddleware } from "../../middleware/auth.js";
import { tenantMiddleware, requireOrgRole } from "../../middleware/tenant.js";
import { ok, err } from "../../types/api.js";
import * as workflowService from "./workflows.service.js";

export const workflowRoutes = new Hono();

workflowRoutes.use("/*", authMiddleware);
workflowRoutes.use("/*", tenantMiddleware);

// ── Schemas ──────────────────────────────────────────────────────────

const createWorkflowSchema = z.object({
  name: z.string().min(1).max(100),
  description: z.string().max(500).optional(),
  isDefault: z.boolean().optional(),
});

const addStatusSchema = z.object({
  name: z.string().min(1).max(50),
  category: z.enum(["todo", "in_progress", "done"]),
  color: z.string().max(10).optional(),
  sortOrder: z.number().int().min(0).max(100).optional(),
  isInitial: z.boolean().optional(),
  isFinal: z.boolean().optional(),
});

const addTransitionSchema = z.object({
  fromStatusId: z.string().uuid(),
  toStatusId: z.string().uuid(),
  name: z.string().max(100).optional(),
});

// ── Routes ───────────────────────────────────────────────────────────

// GET /workflows — List all available workflows
workflowRoutes.get("/", async (c) => {
  const tenant = c.get("tenant");
  const workflows = await workflowService.getWorkflows(tenant.orgId);
  return c.json(ok(workflows));
});

// GET /workflows/:id — Get workflow with statuses and transitions
workflowRoutes.get("/:id", async (c) => {
  const detail = await workflowService.getWorkflowDetail(c.req.param("id"));
  if (!detail) return c.json(err("Workflow not found"), 404);
  return c.json(ok(detail));
});

// GET /workflows/:id/statuses — Get statuses only
workflowRoutes.get("/:id/statuses", async (c) => {
  const statuses = await workflowService.getStatuses(c.req.param("id"));
  return c.json(ok(statuses));
});

// GET /workflows/:id/transitions/:fromStatusId — Available transitions from a status
workflowRoutes.get("/:id/transitions/:fromStatusId", async (c) => {
  const transitions = await workflowService.getAvailableTransitions(
    c.req.param("id"),
    c.req.param("fromStatusId"),
  );
  return c.json(ok(transitions));
});

// POST /workflows — Create custom workflow (admin+)
workflowRoutes.post(
  "/",
  requireOrgRole("admin"),
  zValidator("json", createWorkflowSchema),
  async (c) => {
    const tenant = c.get("tenant");
    if (!tenant.orgId) return c.json(err("Organization context required"), 400);

    const input = c.req.valid("json");
    const workflow = await workflowService.createWorkflow(tenant.orgId, input);
    return c.json(ok(workflow), 201);
  },
);

// POST /workflows/:id/statuses — Add status to workflow (admin+)
workflowRoutes.post(
  "/:id/statuses",
  requireOrgRole("admin"),
  zValidator("json", addStatusSchema),
  async (c) => {
    const tenant = c.get("tenant");
    const input = c.req.valid("json");

    try {
      const status = await workflowService.addStatus(
        c.req.param("id"),
        tenant.orgId,
        input,
      );
      return c.json(ok(status), 201);
    } catch (e) {
      return c.json(err((e as Error).message), 400);
    }
  },
);

// POST /workflows/:id/transitions — Add transition (admin+)
workflowRoutes.post(
  "/:id/transitions",
  requireOrgRole("admin"),
  zValidator("json", addTransitionSchema),
  async (c) => {
    const tenant = c.get("tenant");
    const input = c.req.valid("json");

    try {
      const transition = await workflowService.addTransition(
        c.req.param("id"),
        tenant.orgId,
        input,
      );
      return c.json(ok(transition), 201);
    } catch (e) {
      return c.json(err((e as Error).message), 400);
    }
  },
);
