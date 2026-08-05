import { loadEnvFile } from "node:process";
import { resolve } from "node:path";

export function resolveTestDatabaseUrl(): string {
  if (process.env.TEST_DATABASE_URL !== undefined) {
    return process.env.TEST_DATABASE_URL;
  }

  if (process.env.DATABASE_URL === undefined) {
    try {
      loadEnvFile(resolve(__dirname, "../../../.env"));
    } catch (error) {
      if (!isMissingFileError(error)) throw error;
    }
  }

  const databaseUrl = process.env.DATABASE_URL;
  if (databaseUrl === undefined) {
    throw new Error(
      "TEST_DATABASE_URL or DATABASE_URL is required for PostgreSQL tests",
    );
  }

  const testUrl = new URL(databaseUrl);
  const databaseName = testUrl.pathname.slice(1);
  if (!databaseName.endsWith("_test")) {
    testUrl.pathname = `/${databaseName}_test`;
  }
  return testUrl.toString();
}

function isMissingFileError(error: unknown): boolean {
  return (
    typeof error === "object" &&
    error !== null &&
    "code" in error &&
    error.code === "ENOENT"
  );
}
