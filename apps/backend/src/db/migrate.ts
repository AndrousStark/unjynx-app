import { drizzle } from "drizzle-orm/postgres-js";
import { migrate } from "drizzle-orm/postgres-js/migrator";
import postgres from "postgres";
import pino from "pino";

const logger = pino({
  level: "info",
  transport: { target: "pino-pretty", options: { colorize: true } },
});

async function runMigrations() {
  const databaseUrl = process.env.DATABASE_URL;
  if (!databaseUrl) {
    throw new Error("DATABASE_URL environment variable is required");
  }

  logger.info("Connecting to database for migrations...");
  const migrationClient = postgres(databaseUrl, { max: 1 });
  const db = drizzle(migrationClient);

  logger.info({ migrationsFolder: "./drizzle" }, "Running migrations...");
  const start = Date.now();
  await migrate(db, { migrationsFolder: "./drizzle" });
  logger.info({ durationMs: Date.now() - start }, "Migrations complete.");

  await migrationClient.end();
  process.exit(0);
}

runMigrations().catch((error) => {
  logger.error({ err: error }, "Migration failed");
  process.exit(1);
});
