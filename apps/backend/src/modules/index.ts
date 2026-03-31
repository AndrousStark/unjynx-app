import type { Hono } from "hono";
import { organizationRoutes } from "./organizations/organizations.routes.js";
import { workflowRoutes } from "./workflows/workflows.routes.js";
import { sprintRoutes } from "./sprints/sprints.routes.js";
import { healthRoutes } from "./health/health.routes.js";
import { taskRoutes } from "./tasks/tasks.routes.js";
import { projectRoutes } from "./projects/projects.routes.js";
import { authRoutes } from "./auth/auth.routes.js";
import { subtaskRoutes } from "./subtasks/subtasks.routes.js";
import { tagRoutes, taskTagRoutes } from "./tags/tags.routes.js";
import { sectionRoutes } from "./sections/sections.routes.js";
import { commentRoutes } from "./comments/comments.routes.js";
import { contentRoutes } from "./content/content.routes.js";
import { progressRoutes } from "./progress/progress.routes.js";
import { recurringRoutes, occurrencesRoutes } from "./recurring/recurring.routes.js";
import { syncRoutes } from "./sync/sync.routes.js";
import { notificationRoutes } from "./notifications/notifications.routes.js";
import { channelRoutes } from "./channels/channels.routes.js";
import { webhookRoutes } from "./channels/webhook-handler.js";
import { verificationRoutes } from "./channels/verification.js";
import { billingRoutes } from "./billing/billing.routes.js";
import { gamificationRoutes } from "./gamification/gamification.routes.js";
import { accountabilityRoutes } from "./accountability/accountability.routes.js";
import { teamRoutes } from "./teams/teams.routes.js";
import { importExportRoutes } from "./import-export/import-export.routes.js";
import { adminRoutes } from "./admin/admin.routes.js";
import { devPortalRoutes } from "./dev-portal/dev-portal.routes.js";
import { calendarRoutes } from "./calendar/calendar.routes.js";
import { modesRoutes } from "./modes/modes.routes.js";
import { aiRoutes } from "./ai/ai.routes.js";
import { logtoWebhookRoutes } from "./auth/logto-webhook.routes.js";
import { planningRoutes } from "./planning/planning.routes.js";
import { templateRoutes } from "./templates/templates.routes.js";
import { pomodoroRoutes } from "./pomodoro/pomodoro.routes.js";
import { metricsRoutes } from "../metrics/metrics.routes.js";

/**
 * Register all domain modules on the Hono app instance.
 *
 * Each module is self-contained with its own routes, service, repository,
 * and validation schemas. New modules are added here as single lines.
 *
 * All REST APIs are versioned under /api/v1/.
 */
export function registerModules(app: Hono): void {
  // Health (no auth, no version prefix)
  app.route("/", healthRoutes);

  // Organizations (multi-tenant root)
  app.route("/api/v1/orgs", organizationRoutes);

  // Workflows (configurable status pipelines)
  app.route("/api/v1/workflows", workflowRoutes);

  // Sprints (Scrum cycle management)
  app.route("/api/v1/sprints", sprintRoutes);

  // Domain modules (versioned)
  app.route("/api/v1/tasks", taskRoutes);
  app.route("/api/v1/projects", projectRoutes);
  app.route("/api/v1/auth", authRoutes);
  app.route("/api/v1/tasks/:taskId/subtasks", subtaskRoutes);
  app.route("/api/v1/tags", tagRoutes);
  app.route("/api/v1/tasks/:taskId/tags", taskTagRoutes);
  app.route("/api/v1/projects/:projectId/sections", sectionRoutes);
  app.route("/api/v1/tasks/:taskId/comments", commentRoutes);
  app.route("/api/v1/content", contentRoutes);
  app.route("/api/v1/progress", progressRoutes);
  app.route("/api/v1/tasks/:id/recurrence", recurringRoutes);
  app.route("/api/v1/tasks/:id/occurrences", occurrencesRoutes);
  app.route("/api/v1/sync", syncRoutes);
  app.route("/api/v1/notifications", notificationRoutes);
  app.route("/api/v1/channels", channelRoutes);

  // Premium & Team features
  app.route("/api/v1/billing", billingRoutes);
  app.route("/api/v1/gamification", gamificationRoutes);
  app.route("/api/v1/accountability", accountabilityRoutes);
  app.route("/api/v1/teams", teamRoutes);
  app.route("/api/v1", importExportRoutes);
  app.route("/api/v1/admin", adminRoutes);
  app.route("/api/v1/dev", devPortalRoutes);

  // Calendar integration (Google Calendar read-only)
  app.route("/api/v1/calendar", calendarRoutes);

  // Industry modes
  app.route("/api/v1/modes", modesRoutes);

  // AI & ML intelligence
  app.route("/api/v1/ai", aiRoutes);
  app.route("/api/v1/planning", planningRoutes);
  app.route("/api/v1/templates", templateRoutes);
  app.route("/api/v1/pomodoro", pomodoroRoutes);

  // Prometheus metrics (bearer token protected)
  app.route("/metrics", metricsRoutes);

  // Webhooks (no auth — providers call these directly)
  app.route("/api/v1/webhooks", webhookRoutes);
  app.route("/api/v1/webhooks", logtoWebhookRoutes);

  // Channel verification (OTP — requires auth)
  app.route("/api/v1/channels", verificationRoutes);
}
