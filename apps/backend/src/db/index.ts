import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import { env } from "../env.js";
import * as schema from "./schema/index.js";

// ── Primary DB (Neon PostgreSQL — core app data) ────────────────────
const queryClient = postgres(env.DATABASE_URL, {
  max: 10,
  idle_timeout: 20,
  connect_timeout: 10,
});

export const db = drizzle(queryClient, { schema });

// ── Content DB (VPS PostgreSQL — content + notifications) ───────────
// Falls back to primary DB if CONTENT_DATABASE_URL is not set.
const contentUrl = process.env.CONTENT_DATABASE_URL || env.DATABASE_URL;
const contentClient = contentUrl !== env.DATABASE_URL
  ? postgres(contentUrl, {
      max: 5,
      idle_timeout: 20,
      connect_timeout: 10,
    })
  : queryClient;

export const contentDb = drizzle(contentClient, { schema });

export type Database = typeof db;
