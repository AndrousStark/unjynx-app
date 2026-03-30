// ── Task Templates API Routes ─────────────────────────────────────────

import { Hono } from "hono";
import { zValidator } from "@hono/zod-validator";
import { z } from "zod";
import { authMiddleware } from "../../middleware/auth.js";
import { adminGuard } from "../../middleware/admin-guard.js";
import { ok, err } from "../../types/api.js";
import * as templateService from "./templates.service.js";

export const templateRoutes = new Hono();

templateRoutes.use("/*", authMiddleware);

// ── GET /templates — List all templates ──
templateRoutes.get("/", async (c) => {
  const auth = c.get("auth");
  const category = c.req.query("category");
  const templates = await templateService.getTemplates(auth.profileId, category);
  return c.json(ok(templates));
});

// ── GET /templates/suggest?q=sprint — AI template suggestions ──
// MUST be before /:id to avoid route shadowing
templateRoutes.get("/suggest", async (c) => {
  const auth = c.get("auth");
  const query = c.req.query("q") ?? "";
  if (!query || query.length < 2) return c.json(ok([]));
  const suggestions = await templateService.suggestTemplates(auth.profileId, query);
  return c.json(ok(suggestions));
});

// ── GET /templates/:id — Get single template (scoped to user + global) ──
templateRoutes.get("/:id", async (c) => {
  const auth = c.get("auth");
  const template = await templateService.getTemplate(c.req.param("id"), auth.profileId);
  if (!template) return c.json(err("Template not found"), 404);
  return c.json(ok(template));
});

// ── POST /templates — Create custom template ──
const createSchema = z.object({
  title: z.string().min(1).max(200),
  description: z.string().max(1000).optional(),
  priority: z.enum(["none", "low", "medium", "high", "urgent"]).optional(),
  category: z.string().max(50).optional(),
  subtasks: z.array(z.object({
    title: z.string().min(1),
    estimatedMinutes: z.number().min(1).max(480),
    isOptional: z.boolean().optional(),
  })).optional(),
});

templateRoutes.post(
  "/",
  zValidator("json", createSchema),
  async (c) => {
    const auth = c.get("auth");
    const body = c.req.valid("json");
    const template = await templateService.createTemplate(auth.profileId, body);
    return c.json(ok(template), 201);
  },
);

// ── DELETE /templates/:id — Delete custom template ──
templateRoutes.delete("/:id", async (c) => {
  const auth = c.get("auth");
  const deleted = await templateService.deleteTemplate(auth.profileId, c.req.param("id"));
  if (!deleted) return c.json(err("Template not found or cannot be deleted"), 404);
  return c.json(ok({ deleted: true }));
});

// ── POST /templates/:id/use — Use a template (creates task + subtasks) ──
templateRoutes.post("/:id/use", async (c) => {
  const auth = c.get("auth");
  try {
    const result = await templateService.useTemplate(auth.profileId, c.req.param("id"));
    return c.json(ok(result), 201);
  } catch (e) {
    return c.json(err(e instanceof Error ? e.message : "Failed to use template"), 400);
  }
});

// ── POST /templates/seed — Seed system templates (admin only) ──
templateRoutes.post("/seed", adminGuard("owner", "admin"), async (c) => {
  const count = await templateService.seedSystemTemplates();
  return c.json(ok({ seeded: count }));
});

// ── POST /templates/from-decomposition — Save AI decomposition as template ──
const fromDecompSchema = z.object({
  title: z.string().min(1).max(200),
  subtasks: z.array(z.object({
    title: z.string().min(1),
    estimatedMinutes: z.number().min(1).max(480),
    isOptional: z.boolean().optional(),
  })).min(1),
  category: z.string().max(50).optional(),
});

templateRoutes.post(
  "/from-decomposition",
  zValidator("json", fromDecompSchema),
  async (c) => {
    const auth = c.get("auth");
    const body = c.req.valid("json");
    const template = await templateService.saveDecompositionAsTemplate(
      auth.profileId,
      body.title,
      body.subtasks,
      body.category,
    );
    return c.json(ok(template), 201);
  },
);
