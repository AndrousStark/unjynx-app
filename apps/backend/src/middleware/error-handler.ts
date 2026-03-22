import * as Sentry from "@sentry/node";
import type { ErrorHandler } from "hono";
import { HTTPException } from "hono/http-exception";
import { ZodError } from "zod";
import { err } from "../types/api.js";
import { logger } from "./logger.js";
import { env } from "../env.js";

export const errorHandler: ErrorHandler = (error, c) => {
  if (error instanceof HTTPException) {
    return c.json(err(error.message), error.status);
  }

  if (error instanceof ZodError) {
    const messages = error.issues.map(
      (issue) => `${issue.path.join(".")}: ${issue.message}`,
    );
    return c.json(err(`Validation failed: ${messages.join("; ")}`), 400);
  }

  // Log full error details server-side only — NEVER send to client
  logger.error({ err: error, stack: error.stack }, "Unhandled error");

  // Report to Sentry
  Sentry.captureException(error);

  // In production: generic message only. No stack traces, no file paths,
  // no DB schema details, no raw SQL errors — just "Internal server error".
  const isProduction = env.NODE_ENV === "production";
  const message = isProduction
    ? "Internal server error"
    : `Internal server error: ${error.message}`;

  return c.json(err(message), 500);
};
