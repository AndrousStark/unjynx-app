import { Hono } from "hono";
import { z } from "zod";
import { zValidator } from "@hono/zod-validator";
import { authMiddleware } from "../../middleware/auth.js";
import { tenantMiddleware, requireOrgRole } from "../../middleware/tenant.js";
import { ok, err } from "../../types/api.js";
import * as cfService from "./custom-fields.service.js";

export const customFieldRoutes = new Hono();

customFieldRoutes.use("/*", authMiddleware);
customFieldRoutes.use("/*", tenantMiddleware);

// ── Schemas ──────────────────────────────────────────────────────────

const createFieldSchema = z.object({
  name: z.string().min(1).max(100),
  fieldKey: z.string().min(1).max(50).regex(/^[a-z][a-z0-9_]*$/, "Must be snake_case"),
  fieldType: z.enum([
    "text", "number", "date", "select", "multi_select",
    "user", "url", "checkbox", "email", "phone",
    "rich_text", "label", "currency",
  ]),
  description: z.string().max(500).optional(),
  isRequired: z.boolean().optional(),
  defaultValue: z.unknown().optional(),
  options: z.record(z.unknown()).optional(),
  applicableTaskTypes: z.array(z.string()).optional(),
  applicableProjectIds: z.array(z.string().uuid()).optional(),
});

const updateFieldSchema = z.object({
  name: z.string().min(1).max(100).optional(),
  description: z.string().max(500).optional(),
  isRequired: z.boolean().optional(),
  options: z.record(z.unknown()).optional(),
  sortOrder: z.number().int().min(0).optional(),
});

const setValueSchema = z.object({
  fieldId: z.string().uuid(),
  value: z.unknown(),
});

const createSlaSchema = z.object({
  name: z.string().min(1).max(100),
  description: z.string().max(500).optional(),
  projectId: z.string().uuid().optional(),
  conditions: z.object({
    priorities: z.array(z.string()).optional(),
    taskTypes: z.array(z.string()).optional(),
  }).optional(),
  responseTimeMinutes: z.number().int().min(1).optional(),
  resolutionTimeMinutes: z.number().int().min(1).optional(),
  businessHours: z.record(z.object({
    start: z.string().regex(/^\d{2}:\d{2}$/),
    end: z.string().regex(/^\d{2}:\d{2}$/),
  })).optional(),
  timezone: z.string().max(50).optional(),
});

const updateSlaSchema = z.object({
  name: z.string().min(1).max(100).optional(),
  description: z.string().max(500).optional(),
  responseTimeMinutes: z.number().int().min(1).optional(),
  resolutionTimeMinutes: z.number().int().min(1).optional(),
  businessHours: z.record(z.object({
    start: z.string().regex(/^\d{2}:\d{2}$/),
    end: z.string().regex(/^\d{2}:\d{2}$/),
  })).optional(),
  timezone: z.string().max(50).optional(),
  isActive: z.boolean().optional(),
});

// ── Custom Field Definition Routes ───────────────────────────────────

// POST /custom-fields — Create field definition (admin+)
customFieldRoutes.post(
  "/",
  requireOrgRole("admin"),
  zValidator("json", createFieldSchema),
  async (c) => {
    const tenant = c.get("tenant");
    if (!tenant.orgId) return c.json(err("Organization context required"), 400);

    const input = c.req.valid("json");
    try {
      const field = await cfService.createFieldDefinition(tenant.orgId, input);
      return c.json(ok(field), 201);
    } catch (e) {
      return c.json(err((e as Error).message), 400);
    }
  },
);

// GET /custom-fields — List field definitions for org
customFieldRoutes.get("/", async (c) => {
  const tenant = c.get("tenant");
  if (!tenant.orgId) return c.json(err("Organization context required"), 400);

  const fields = await cfService.getFieldDefinitions(tenant.orgId);
  return c.json(ok(fields));
});

// GET /custom-fields/:id — Get field definition
customFieldRoutes.get("/:id", async (c) => {
  const field = await cfService.getFieldDefinition(c.req.param("id"));
  if (!field) return c.json(err("Field not found"), 404);
  return c.json(ok(field));
});

// PATCH /custom-fields/:id — Update field definition (admin+)
customFieldRoutes.patch(
  "/:id",
  requireOrgRole("admin"),
  zValidator("json", updateFieldSchema),
  async (c) => {
    const input = c.req.valid("json");
    try {
      const field = await cfService.updateFieldDefinition(c.req.param("id"), input);
      return c.json(ok(field));
    } catch (e) {
      return c.json(err((e as Error).message), 400);
    }
  },
);

// DELETE /custom-fields/:id — Archive field definition (admin+)
customFieldRoutes.delete(
  "/:id",
  requireOrgRole("admin"),
  async (c) => {
    await cfService.archiveFieldDefinition(c.req.param("id"));
    return c.json(ok({ archived: true }));
  },
);

// ── Custom Field Value Routes ────────────────────────────────────────

// GET /custom-fields/tasks/:taskId/values — Get all field values for a task
customFieldRoutes.get("/tasks/:taskId/values", async (c) => {
  const values = await cfService.getFieldValues(c.req.param("taskId"));
  return c.json(ok(values));
});

// PUT /custom-fields/tasks/:taskId/values — Set a field value on a task
customFieldRoutes.put(
  "/tasks/:taskId/values",
  zValidator("json", setValueSchema),
  async (c) => {
    const tenant = c.get("tenant");
    if (!tenant.orgId) return c.json(err("Organization context required"), 400);

    const { fieldId, value } = c.req.valid("json");
    const result = await cfService.setFieldValue(
      tenant.orgId,
      c.req.param("taskId"),
      fieldId,
      value,
    );
    return c.json(ok(result));
  },
);

// DELETE /custom-fields/tasks/:taskId/values/:fieldId — Remove a field value
customFieldRoutes.delete("/tasks/:taskId/values/:fieldId", async (c) => {
  await cfService.deleteFieldValue(c.req.param("taskId"), c.req.param("fieldId"));
  return c.json(ok({ deleted: true }));
});

// ── SLA Policy Routes ────────────────────────────────────────────────

// POST /custom-fields/sla — Create SLA policy (admin+)
customFieldRoutes.post(
  "/sla",
  requireOrgRole("admin"),
  zValidator("json", createSlaSchema),
  async (c) => {
    const tenant = c.get("tenant");
    if (!tenant.orgId) return c.json(err("Organization context required"), 400);

    const input = c.req.valid("json");
    try {
      const policy = await cfService.createSlaPolicy(tenant.orgId, input);
      return c.json(ok(policy), 201);
    } catch (e) {
      return c.json(err((e as Error).message), 400);
    }
  },
);

// GET /custom-fields/sla — List SLA policies
customFieldRoutes.get(
  "/sla",
  zValidator("query", z.object({ projectId: z.string().uuid().optional() })),
  async (c) => {
    const tenant = c.get("tenant");
    if (!tenant.orgId) return c.json(err("Organization context required"), 400);

    const { projectId } = c.req.valid("query");
    const policies = await cfService.getSlaPolicies(tenant.orgId, projectId);
    return c.json(ok(policies));
  },
);

// GET /custom-fields/sla/:id — Get SLA policy
customFieldRoutes.get("/sla/:id", async (c) => {
  const policy = await cfService.getSlaPolicy(c.req.param("id"));
  if (!policy) return c.json(err("SLA policy not found"), 404);
  return c.json(ok(policy));
});

// PATCH /custom-fields/sla/:id — Update SLA policy (admin+)
customFieldRoutes.patch(
  "/sla/:id",
  requireOrgRole("admin"),
  zValidator("json", updateSlaSchema),
  async (c) => {
    const input = c.req.valid("json");
    try {
      const policy = await cfService.updateSlaPolicy(c.req.param("id"), input);
      return c.json(ok(policy));
    } catch (e) {
      return c.json(err((e as Error).message), 400);
    }
  },
);

// DELETE /custom-fields/sla/:id — Delete SLA policy (admin+)
customFieldRoutes.delete(
  "/sla/:id",
  requireOrgRole("admin"),
  async (c) => {
    await cfService.deleteSlaPolicy(c.req.param("id"));
    return c.json(ok({ deleted: true }));
  },
);
