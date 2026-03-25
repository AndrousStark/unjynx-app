import { z } from "zod";

const envSchema = z.object({
  NODE_ENV: z
    .enum(["development", "production", "test"])
    .default("development"),
  PORT: z.coerce.number().default(3000),
  LOG_LEVEL: z
    .enum(["fatal", "error", "warn", "info", "debug", "trace"])
    .default("info"),

  // Database
  DATABASE_URL: z.string().url(),

  // Redis
  REDIS_URL: z.string().default("redis://localhost:6379"),

  // Auth (Logto)
  LOGTO_ENDPOINT: z.string().url().default("http://localhost:3001"),
  LOGTO_APP_ID: z.string().optional(),
  LOGTO_APP_SECRET: z.string().optional(),

  // Auth (Logto M2M — for Management API)
  LOGTO_M2M_APP_ID: z.string().optional(),
  LOGTO_M2M_APP_SECRET: z.string().optional(),

  // Storage (MinIO / S3)
  S3_ENDPOINT: z.string().default("http://localhost:9000"),
  S3_ACCESS_KEY: z.string().default("minioadmin"),
  S3_SECRET_KEY: z.string().default("minioadmin"),
  S3_BUCKET: z.string().default("todo-uploads"),
  S3_REGION: z.string().default("us-east-1"),

  // Billing (RevenueCat)
  REVENUECAT_WEBHOOK_SECRET: z.string().default("rc_webhook_secret_dev"),

  // Channel Providers
  TELEGRAM_BOT_TOKEN: z.string().optional(),
  TELEGRAM_WEBHOOK_SECRET: z.string().optional(),
  GUPSHUP_API_KEY: z.string().optional(),
  GUPSHUP_WEBHOOK_SECRET: z.string().optional(),
  MSG91_AUTH_KEY: z.string().optional(),
  MSG91_WEBHOOK_TOKEN: z.string().optional(),

  // Email (SendGrid)
  SENDGRID_API_KEY: z.string().optional(),
  SENDGRID_FROM_EMAIL: z.string().email().optional(),
  SENDGRID_FROM_NAME: z.string().optional(),

  // Google Calendar Integration
  GOOGLE_CLIENT_ID: z.string().optional(),
  GOOGLE_CLIENT_SECRET: z.string().optional(),

  // Microsoft Outlook Calendar Integration (Graph API)
  MICROSOFT_CLIENT_ID: z.string().optional(),
  MICROSOFT_CLIENT_SECRET: z.string().optional(),

  // ML Service
  ML_SERVICE_URL: z.string().default("http://ml-service:8000"),

  // AI (Claude API)
  ANTHROPIC_API_KEY: z.string().optional(),

  // Monitoring (Sentry)
  SENTRY_DSN: z.string().optional(),
  SENTRY_ENVIRONMENT: z.string().default("development"),
  SENTRY_TRACES_SAMPLE_RATE: z.coerce.number().min(0).max(1).default(0.1),
});

export type Env = z.infer<typeof envSchema>;

function loadEnv(): Env {
  const result = envSchema.safeParse(process.env);

  if (!result.success) {
    const formatted = result.error.flatten().fieldErrors;
    const message = Object.entries(formatted)
      .map(([key, errors]) => `  ${key}: ${errors?.join(", ")}`)
      .join("\n");

    throw new Error(`Invalid environment variables:\n${message}`);
  }

  return result.data;
}

export const env = loadEnv();
