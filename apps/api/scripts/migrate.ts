import { runMigrations } from "./migration-runner";

async function migrate(): Promise<void> {
  const connectionString = process.env.DATABASE_URL;
  if (connectionString === undefined || connectionString.length === 0) {
    throw new Error("DATABASE_URL is required");
  }

  await runMigrations({
    connectionString,
    onMigrationApplied: (name) => process.stdout.write(`Applied ${name}\n`),
  });
  process.stdout.write("Database is up to date\n");
}

migrate().catch((error: unknown) => {
  const message = error instanceof Error ? error.message : String(error);
  process.stderr.write(`Migration failed: ${message}\n`);
  process.exitCode = 1;
});
