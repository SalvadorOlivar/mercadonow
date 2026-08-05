const DEFAULT_TEST_DATABASE_URL =
  "postgres://mercadonow:mercadonow@localhost:5432/mercadonow_test";

process.env.DATABASE_URL =
  process.env.TEST_DATABASE_URL ?? DEFAULT_TEST_DATABASE_URL;
process.env.NODE_ENV = "test";
process.env.PORT = "3001";
process.env.CORS_ORIGINS = "http://localhost:3000";
process.env.OPENAPI_ENABLED = "false";
