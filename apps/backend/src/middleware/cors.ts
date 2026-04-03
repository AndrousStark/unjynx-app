import { cors } from "hono/cors";
import { env } from "../env.js";

const allowedOrigins =
  env.NODE_ENV === "production"
    ? ["https://unjynx.me", "https://admin.unjynx.me", "https://app.unjynx.me"]
    : ["http://localhost:3000", "http://localhost:3003", "http://localhost:4321", "http://localhost:5173", "http://localhost:5174", "http://localhost:3002", "http://localhost:8080"];

export const corsMiddleware = cors({
  origin: allowedOrigins,
  allowMethods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
  allowHeaders: ["Content-Type", "Authorization", "Idempotency-Key", "X-Request-Id"],
  exposeHeaders: ["X-Request-Id"],
  maxAge: 86400,
  credentials: true,
});
