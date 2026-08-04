import { readFile } from "node:fs/promises";
import { join } from "node:path";

import { Client } from "pg";

const DEFAULT_TEST_DATABASE_URL =
  "postgres://mercadonow:mercadonow@localhost:5432/mercadonow_test";

export default async function globalSetup(): Promise<void> {
  const connectionString =
    process.env.TEST_DATABASE_URL ?? DEFAULT_TEST_DATABASE_URL;
  const testUrl = new URL(connectionString);
  const databaseName = testUrl.pathname.slice(1);
  if (!/^[a-z0-9_]+$/.test(databaseName) || !databaseName.endsWith("_test")) {
    throw new Error("Integration DATABASE_URL must target a *_test database");
  }

  const adminUrl = new URL(testUrl);
  adminUrl.pathname = "/postgres";
  const admin = new Client({ connectionString: adminUrl.toString() });
  await admin.connect();
  try {
    const existing = await admin.query<{ exists: boolean }>(
      "SELECT EXISTS(SELECT 1 FROM pg_database WHERE datname = $1) AS exists",
      [databaseName],
    );
    if (existing.rows[0]?.exists !== true) {
      await admin.query(`CREATE DATABASE "${databaseName}"`);
    }
  } finally {
    await admin.end();
  }

  const testClient = new Client({ connectionString });
  await testClient.connect();
  try {
    await testClient.query("DROP SCHEMA public CASCADE");
    await testClient.query("CREATE SCHEMA public");
    const migration = await readFile(
      join(__dirname, "../database/migrations/001_create_billing_tables.sql"),
      "utf8",
    );
    await testClient.query(migration);
  } finally {
    await testClient.end();
  }
}
