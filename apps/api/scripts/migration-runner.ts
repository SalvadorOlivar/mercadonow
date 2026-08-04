import { createHash } from "node:crypto";
import { readdir, readFile } from "node:fs/promises";
import { join } from "node:path";

import { Client } from "pg";

const MIGRATION_FILE = /^\d{3}_[a-z0-9_]+\.sql$/;
const MIGRATION_LOCK_ID = 1_384_541_348;

interface AppliedMigrationRow {
  readonly name: string;
  readonly checksum: string;
}

export interface RunMigrationsOptions {
  readonly connectionString: string;
  readonly migrationsDirectory?: string;
  readonly onMigrationApplied?: (name: string) => void;
}

/**
 * Applies every pending SQL migration in filename order.
 *
 * Production, local development, and test setup deliberately share this
 * function so a new migration cannot be omitted from one environment.
 */
export async function runMigrations(
  options: RunMigrationsOptions,
): Promise<void> {
  const migrationsDirectory =
    options.migrationsDirectory ?? join(__dirname, "../database/migrations");
  const migrationNames = (await readdir(migrationsDirectory))
    .filter((name) => MIGRATION_FILE.test(name))
    .sort();
  const client = new Client({ connectionString: options.connectionString });

  await client.connect();
  try {
    await client.query("SELECT pg_advisory_lock($1)", [MIGRATION_LOCK_ID]);
    await client.query(`
      CREATE TABLE IF NOT EXISTS schema_migrations (
        name text PRIMARY KEY,
        checksum text NOT NULL,
        applied_at timestamptz NOT NULL DEFAULT now()
      )
    `);

    const result = await client.query<AppliedMigrationRow>(
      "SELECT name, checksum FROM schema_migrations",
    );
    const applied = new Map(
      result.rows.map((row) => [row.name, row.checksum] as const),
    );

    for (const name of migrationNames) {
      const sql = await readFile(join(migrationsDirectory, name), "utf8");
      const checksum = createHash("sha256").update(sql).digest("hex");
      const previousChecksum = applied.get(name);

      if (previousChecksum !== undefined) {
        if (previousChecksum !== checksum) {
          throw new Error(`Applied migration was modified: ${name}`);
        }
        continue;
      }

      await client.query("BEGIN");
      try {
        await client.query(sql);
        await client.query(
          "INSERT INTO schema_migrations (name, checksum) VALUES ($1, $2)",
          [name, checksum],
        );
        await client.query("COMMIT");
        options.onMigrationApplied?.(name);
      } catch (error) {
        await client.query("ROLLBACK");
        throw error;
      }
    }
  } finally {
    await client.query("SELECT pg_advisory_unlock($1)", [MIGRATION_LOCK_ID]);
    await client.end();
  }
}
