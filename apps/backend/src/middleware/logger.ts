import { createMiddleware } from "hono/factory";
import pino from "pino";
import { env } from "../env.js";

export const logger = pino({
  level: env.LOG_LEVEL,
  transport:
    env.NODE_ENV === "development"
      ? { target: "pino-pretty", options: { colorize: true } }
      : undefined,
});

export const loggerMiddleware = createMiddleware(async (c, next) => {
  const start = Date.now();
  const requestId = crypto.randomUUID();
  c.header("X-Request-Id", requestId);

  await next();

  const duration = Date.now() - start;
  logger.info({
    requestId,
    method: c.req.method,
    path: c.req.path,
    status: c.res.status,
    duration: `${duration}ms`,
  });
});
