import { Hono } from "hono";
import { zValidator } from "@hono/zod-validator";
import { authMiddleware } from "../../middleware/auth.js";
import { ok, err } from "../../types/api.js";
import {
  importPreviewSchema,
  importExecuteSchema,
  exportQuerySchema,
} from "./import-export.schema.js";
import * as importExportService from "./import-export.service.js";

export const importExportRoutes = new Hono();

importExportRoutes.use("/*", authMiddleware);

// ── Import ────────────────────────────────────────────────────────────

// POST /import/preview - Preview parsed tasks (first 10)
importExportRoutes.post(
  "/import/preview",
  zValidator("json", importPreviewSchema),
  async (c) => {
    const input = c.req.valid("json");

    try {
      const result = importExportService.previewImport(input);
      return c.json(ok(result));
    } catch (error) {
      const message = error instanceof Error ? error.message : "Failed to parse CSV";
      return c.json(err(message), 400);
    }
  },
);

// POST /import/execute - Execute import with mapping
importExportRoutes.post(
  "/import/execute",
  zValidator("json", importExecuteSchema),
  async (c) => {
    const auth = c.get("auth");
    const input = c.req.valid("json");

    try {
      const result = await importExportService.executeImport(
        auth.profileId,
        input,
      );
      return c.json(ok(result), 201);
    } catch (error) {
      const message = error instanceof Error ? error.message : "Import failed";
      return c.json(err(message), 500);
    }
  },
);

// ── Export ─────────────────────────────────────────────────────────────

// GET /export/csv - Export tasks as CSV
importExportRoutes.get(
  "/export/csv",
  zValidator("query", exportQuerySchema),
  async (c) => {
    const auth = c.get("auth");
    const query = c.req.valid("query");
    const csv = await importExportService.exportCsv(auth.profileId, query);

    return new Response(csv, {
      headers: {
        "Content-Type": "text/csv",
        "Content-Disposition": 'attachment; filename="unjynx-tasks.csv"',
      },
    });
  },
);

// GET /export/json - Export all user data as JSON (GDPR)
importExportRoutes.get("/export/json", async (c) => {
  const auth = c.get("auth");
  const data = await importExportService.exportJson(auth.profileId);
  return c.json(ok(data));
});

// GET /export/ics - Export tasks as ICS (RFC 5545)
importExportRoutes.get(
  "/export/ics",
  zValidator("query", exportQuerySchema),
  async (c) => {
    const auth = c.get("auth");
    const query = c.req.valid("query");
    const ics = await importExportService.exportIcs(auth.profileId, query);

    return new Response(ics, {
      headers: {
        "Content-Type": "text/calendar",
        "Content-Disposition": 'attachment; filename="unjynx-tasks.ics"',
      },
    });
  },
);

// ── GDPR ──────────────────────────────────────────────────────────────

// POST /data/request - GDPR data request
importExportRoutes.post("/data/request", async (c) => {
  const auth = c.get("auth");
  const result = importExportService.createDataRequest(auth.profileId);
  return c.json(ok(result), 201);
});

// DELETE /data/account - Delete account (soft delete, 30-day grace)
importExportRoutes.delete("/data/account", async (c) => {
  const auth = c.get("auth");

  try {
    const result = await importExportService.scheduleAccountDeletion(
      auth.profileId,
    );
    return c.json(ok(result));
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to schedule deletion";
    return c.json(err(message), 500);
  }
});
