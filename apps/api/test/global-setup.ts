import { DataSource } from "typeorm";

import { createPostgresqlDataSource } from "../src/config/database/postgresql/postgresql-data.source";
import { resolveTestDatabaseUrl } from "./test-database-url";

export default async function globalSetup(): Promise<void> {
  const connectionString = resolveTestDatabaseUrl();
  const testUrl = new URL(connectionString);
  const databaseName = testUrl.pathname.slice(1);
  if (!/^[a-z0-9_]+$/.test(databaseName) || !databaseName.endsWith("_test")) {
    throw new Error("Integration DATABASE_URL must target a *_test database");
  }

  const adminUrl = new URL(testUrl);
  adminUrl.pathname = "/postgres";
  const admin = new DataSource({ type: "postgres", url: adminUrl.toString() });
  await admin.initialize();
  try {
    const existing = await admin.query<Array<{ exists: boolean }>>(
      "SELECT EXISTS(SELECT 1 FROM pg_database WHERE datname = $1) AS exists",
      [databaseName],
    );
    if (existing[0]?.exists !== true) {
      await admin.query(`CREATE DATABASE "${databaseName}"`);
    }
  } finally {
    await admin.destroy();
  }

  const testDataSource = createPostgresqlDataSource(connectionString);
  await testDataSource.initialize();
  try {
    await testDataSource.query("DROP SCHEMA public CASCADE");
    await testDataSource.query("CREATE SCHEMA public");
    await testDataSource.runMigrations({ transaction: "each" });
  } finally {
    await testDataSource.destroy();
  }
}
