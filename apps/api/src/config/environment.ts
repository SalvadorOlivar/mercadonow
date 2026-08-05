export const NODE_ENVIRONMENTS = ["development", "test", "production"] as const;

export type NodeEnvironment = (typeof NODE_ENVIRONMENTS)[number];

export interface EnvironmentVariables {
  readonly NODE_ENV: NodeEnvironment;
  readonly PORT: number;
  readonly DATABASE_URL: string;
  readonly CORS_ORIGINS: readonly string[];
  readonly OPENAPI_ENABLED: boolean;
}

export function validateEnvironment(
  input: Record<string, unknown>,
): Record<string, unknown> & EnvironmentVariables {
  const nodeEnv = parseNodeEnvironment(input.NODE_ENV);
  const port = parsePort(input.PORT);
  const databaseUrl = parseDatabaseUrl(input.DATABASE_URL);
  const corsOrigins = parseCorsOrigins(input.CORS_ORIGINS, nodeEnv);
  const openApiEnabled = parseBoolean(
    input.OPENAPI_ENABLED,
    "OPENAPI_ENABLED",
    false,
  );

  return {
    ...input,
    NODE_ENV: nodeEnv,
    PORT: port,
    DATABASE_URL: databaseUrl,
    CORS_ORIGINS: corsOrigins,
    OPENAPI_ENABLED: openApiEnabled,
  };
}

function parseNodeEnvironment(value: unknown): NodeEnvironment {
  if (
    typeof value !== "string" ||
    !NODE_ENVIRONMENTS.some((environment) => environment === value)
  ) {
    throw new Error(
      `NODE_ENV must be one of: ${NODE_ENVIRONMENTS.join(", ")}`,
    );
  }
  return value as NodeEnvironment;
}

function parsePort(value: unknown): number {
  const raw = typeof value === "number" ? String(value) : value;
  if (typeof raw !== "string" || !/^\d+$/.test(raw)) {
    throw new Error("PORT must be an integer between 1 and 65535");
  }
  const port = Number(raw);
  if (!Number.isInteger(port) || port < 1 || port > 65_535) {
    throw new Error("PORT must be an integer between 1 and 65535");
  }
  return port;
}

function parseDatabaseUrl(value: unknown): string {
  if (typeof value !== "string" || value.trim().length === 0) {
    throw new Error("DATABASE_URL is required");
  }
  let url: URL;
  try {
    url = new URL(value);
  } catch {
    throw new Error("DATABASE_URL must be a valid PostgreSQL URL");
  }
  if (
    (url.protocol !== "postgres:" && url.protocol !== "postgresql:") ||
    url.hostname.length === 0 ||
    url.pathname === "/"
  ) {
    throw new Error(
      "DATABASE_URL must use postgres:// or postgresql:// and include a database name",
    );
  }
  return value;
}

function parseCorsOrigins(
  value: unknown,
  nodeEnv: NodeEnvironment,
): readonly string[] {
  if (value === undefined || value === null || value === "") {
    if (nodeEnv === "development") return ["http://localhost:3000"];
    throw new Error("CORS_ORIGINS is required outside development");
  }
  if (typeof value !== "string") {
    throw new Error("CORS_ORIGINS must be a comma-separated list of origins");
  }
  const origins = value.split(",").map((origin) => parseOrigin(origin.trim()));
  if (origins.length === 0 || new Set(origins).size !== origins.length) {
    throw new Error("CORS_ORIGINS must contain unique HTTP(S) origins");
  }
  return origins;
}

function parseOrigin(value: string): string {
  if (value.length === 0 || value === "*") {
    throw new Error("CORS_ORIGINS must not contain empty or wildcard origins");
  }
  let url: URL;
  try {
    url = new URL(value);
  } catch {
    throw new Error(`Invalid CORS origin: ${value}`);
  }
  if (
    (url.protocol !== "http:" && url.protocol !== "https:") ||
    url.username.length > 0 ||
    url.password.length > 0 ||
    url.pathname !== "/" ||
    url.search.length > 0 ||
    url.hash.length > 0
  ) {
    throw new Error(`Invalid CORS origin: ${value}`);
  }
  return url.origin;
}

function parseBoolean(
  value: unknown,
  name: string,
  defaultValue: boolean,
): boolean {
  if (value === undefined || value === "") return defaultValue;
  if (value === true || value === "true") return true;
  if (value === false || value === "false") return false;
  throw new Error(`${name} must be true or false`);
}
