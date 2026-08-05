import { resolveTestDatabaseUrl } from "./test-database-url";

process.env.DATABASE_URL = resolveTestDatabaseUrl();
process.env.NODE_ENV = "test";
process.env.PORT = "3001";
process.env.CORS_ORIGINS = "http://localhost:3000";
process.env.OPENAPI_ENABLED = "false";
