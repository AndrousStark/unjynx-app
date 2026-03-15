import * as Sentry from "@sentry/node";
import { createAdaptorServer } from "@hono/node-server";
import { env } from "./env.js";
import { logger } from "./middleware/logger.js";
import { createApp } from "./app.js";
import { injectWebSocket } from "./ws/index.js";
import { startCronJobs, stopCronJobs } from "./modules/scheduler/cron.js";

// Initialize Sentry before anything else
if (env.SENTRY_DSN) {
  Sentry.init({
    dsn: env.SENTRY_DSN,
    environment: env.SENTRY_ENVIRONMENT,
    tracesSampleRate: env.SENTRY_TRACES_SAMPLE_RATE,
    sendDefaultPii: false,
  });
  logger.info("Sentry initialized for error tracking");
}

const app = createApp();

const server = createAdaptorServer({
  fetch: app.fetch,
  port: env.PORT,
});

injectWebSocket(server);

server.listen(env.PORT, () => {
  logger.info(
    `UNJYNX API server running on http://localhost:${env.PORT} [${env.NODE_ENV}]`,
  );

  // Start cron jobs after server is listening
  startCronJobs();
});

// Graceful shutdown
function handleShutdown(signal: string): void {
  logger.info(`Received ${signal}, shutting down gracefully`);
  stopCronJobs();
  process.exit(0);
}

process.on("SIGTERM", () => handleShutdown("SIGTERM"));
process.on("SIGINT", () => handleShutdown("SIGINT"));

export default app;
