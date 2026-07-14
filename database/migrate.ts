import { Client } from "pg";
import * as fs from "fs";
import * as path from "path";
import { env } from "../config/env";
import { logger } from "../services/logger";

/**
 * Enterprise Database Migration Runner.
 * Executes SQL schema migrations in order and updates migrations history table.
 * Integrates database seed SQL.
 */
export async function runMigrations(): Promise<void> {
  const connectionString = env.DATABASE_URL;

  if (!connectionString || connectionString.startsWith("postgresql://postgres:postgres@localhost")) {
    logger.warn("DATABASE_URL is not configured or using default mock address. Bypassing migrations.");
    return;
  }

  const client = new Client({ connectionString });
  
  try {
    await client.connect();
    logger.info("Connected to PostgreSQL database for migration.");

    // Create tracking table if missing
    await client.query(`
      CREATE TABLE IF NOT EXISTS public._migrations (
        id SERIAL PRIMARY KEY,
        name VARCHAR(255) UNIQUE NOT NULL,
        applied_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
      );
    `);

    const migrationsDir = path.join(process.cwd(), "database", "migrations");
    if (!fs.existsSync(migrationsDir)) {
      logger.warn(`Migrations directory not found at: ${migrationsDir}`);
      return;
    }

    const files = fs.readdirSync(migrationsDir).sort();

    for (const file of files) {
      if (!file.endsWith(".sql")) continue;

      // Check if migration is already applied
      const { rows } = await client.query("SELECT 1 FROM public._migrations WHERE name = $1", [file]);
      if (rows.length > 0) {
        logger.info(`Migration [${file}] already applied. Skipping.`);
        continue;
      }

      logger.info(`Applying migration: ${file}...`);
      const sqlPath = path.join(migrationsDir, file);
      const sqlContent = fs.readFileSync(sqlPath, "utf-8");

      await client.query("BEGIN");
      try {
        await client.query(sqlContent);
        await client.query("INSERT INTO public._migrations (name) VALUES ($1)", [file]);
        await client.query("COMMIT");
        logger.info(`Migration [${file}] applied successfully.`);
      } catch (err) {
        await client.query("ROLLBACK");
        logger.error(`Migration [${file}] failed to apply. Transaction rolled back.`, err);
        throw err;
      }
    }

    // Apply seed data
    const seedPath = path.join(process.cwd(), "database", "seed.sql");
    if (fs.existsSync(seedPath)) {
      logger.info("Applying database seeds from seed.sql...");
      const seedSql = fs.readFileSync(seedPath, "utf-8");
      await client.query(seedSql);
      logger.info("Seed data applied successfully.");
    }

  } catch (error) {
    logger.error("Database migration runner crashed.", error);
    throw error;
  } finally {
    await client.end();
  }
}

// Direct runner execution trigger
if (typeof require !== "undefined" && require.main === module) {
  runMigrations()
    .then(() => {
      logger.info("Migrations check successfully completed.");
      process.exit(0);
    })
    .catch((err) => {
      console.error("Migrations failed execution:", err);
      process.exit(1);
    });
}
