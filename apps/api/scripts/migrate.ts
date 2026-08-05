import { createTypeOrmDataSource } from "../src/database/typeorm-data-source";

async function migrate(): Promise<void> {
  const connectionString = process.env.DATABASE_URL;
  if (connectionString === undefined || connectionString.length === 0) {
    throw new Error("DATABASE_URL is required");
  }

  const dataSource = createTypeOrmDataSource(connectionString);
  await dataSource.initialize();
  try {
    const migrations = await dataSource.runMigrations({ transaction: "each" });
    for (const migration of migrations) {
      process.stdout.write(`Applied ${migration.name}\n`);
    }
    process.stdout.write("Database is up to date\n");
  } finally {
    await dataSource.destroy();
  }
}

migrate().catch((error: unknown) => {
  const message = error instanceof Error ? error.message : String(error);
  process.stderr.write(`Migration failed: ${message}\n`);
  process.exitCode = 1;
});
