const DEFAULT_TEST_DATABASE_URL =
  "postgres://mercadonow:mercadonow@localhost:5432/mercadonow_test";

process.env.DATABASE_URL =
  process.env.TEST_DATABASE_URL ?? DEFAULT_TEST_DATABASE_URL;
