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

async function migrate(): Promise<void> {
  const connectionString = process.env.DATABASE_URL;
  if (connectionString === undefined || connectionString.length === 0) {
    throw new Error("DATABASE_URL is required");
  }

  const migrationsDirectory = join(__dirname, "../database/migrations");
  const migrationNames = (await readdir(migrationsDirectory))
    .filter((name) => MIGRATION_FILE.test(name))
    .sort();
  const client = new Client({ connectionString });

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
        process.stdout.write(`Applied ${name}\n`);
      } catch (error) {
        await client.query("ROLLBACK");
        throw error;
      }
    }

    process.stdout.write("Database is up to date\n");
  } finally {
    await client.query("SELECT pg_advisory_unlock($1)", [MIGRATION_LOCK_ID]);
    await client.end();
  }
}

migrate().catch((error: unknown) => {
  const message = error instanceof Error ? error.message : String(error);
  process.stderr.write(`Migration failed: ${message}\n`);
  process.exitCode = 1;
});

