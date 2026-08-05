import { validateEnvironment } from "./environment";

const valid = {
  NODE_ENV: "production",
  PORT: "3001",
  DATABASE_URL: "postgres://user:password@database:5432/mercadonow",
  CORS_ORIGINS: "https://app.example.com,https://admin.example.com",
  OPENAPI_ENABLED: "false",
};

describe("validateEnvironment", () => {
  it("returns normalized, typed configuration", () => {
    expect(validateEnvironment(valid)).toMatchObject({
      NODE_ENV: "production",
      PORT: 3001,
      DATABASE_URL: valid.DATABASE_URL,
      CORS_ORIGINS: ["https://app.example.com", "https://admin.example.com"],
      OPENAPI_ENABLED: false,
    });
  });

  it("allows only the local web origin by default in development", () => {
    expect(
      validateEnvironment({
        NODE_ENV: "development",
        PORT: "3001",
        DATABASE_URL: valid.DATABASE_URL,
      }).CORS_ORIGINS,
    ).toEqual(["http://localhost:3000"]);
  });

  it.each([
    [{ ...valid, NODE_ENV: undefined }, "NODE_ENV"],
    [{ ...valid, PORT: "0" }, "PORT"],
    [{ ...valid, DATABASE_URL: undefined }, "DATABASE_URL"],
    [{ ...valid, DATABASE_URL: "mysql://database/mercadonow" }, "DATABASE_URL"],
    [{ ...valid, CORS_ORIGINS: "*" }, "CORS_ORIGINS"],
    [{ ...valid, OPENAPI_ENABLED: "yes" }, "OPENAPI_ENABLED"],
  ])("fails early with a clear message for invalid configuration", (input, name) => {
    expect(() => validateEnvironment(input)).toThrow(name);
  });

  it("requires an explicit CORS allowlist outside development", () => {
    expect(() =>
      validateEnvironment({ ...valid, CORS_ORIGINS: undefined }),
    ).toThrow("CORS_ORIGINS is required outside development");
  });
});
