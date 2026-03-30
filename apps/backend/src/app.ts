import { Hono } from "hono";
import { corsMiddleware } from "./middleware/cors.js";
import { rateLimitMiddleware } from "./middleware/rate-limit.js";
import { idempotencyMiddleware } from "./middleware/idempotency.js";
import { loggerMiddleware } from "./middleware/logger.js";
import { errorHandler } from "./middleware/error-handler.js";
import { securityHeadersMiddleware } from "./middleware/security-headers.js";
import { registerModules } from "./modules/index.js";
import { wsApp } from "./ws/index.js";

/**
 * Create a configured Hono app instance.
 *
 * Separated from server startup so the app can be used in tests
 * (via app.request()) without starting a real HTTP server.
 */
export function createApp(): Hono {
  const app = new Hono();

  // Global middleware (order matters)
  app.use("*", securityHeadersMiddleware);
  app.use("*", corsMiddleware);
  app.use("*", rateLimitMiddleware);
  app.use("*", idempotencyMiddleware);
  app.use("*", loggerMiddleware);
  app.onError(errorHandler);

  // Prometheus metrics (no auth, no rate limit — scraped internally)
  app.get("/metrics", async (c) => {
    const { metricsRegistry } = await import("./metrics/ai-metrics.js");
    const metrics = await metricsRegistry.metrics();
    return c.text(metrics, 200, { "Content-Type": metricsRegistry.contentType });
  });

  // Domain modules
  registerModules(app);

  // WebSocket
  app.route("/", wsApp);

  // 404
  app.notFound((c) => {
    return c.json({ success: false, data: null, error: "Not found" }, 404);
  });

  return app;
}
