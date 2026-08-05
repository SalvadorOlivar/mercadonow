import assert from "node:assert/strict";
import test from "node:test";

import { resolvePublicApiUrl } from "./public-env.mjs";

test("uses the local API only in development", () => {
  assert.equal(resolvePublicApiUrl({ NODE_ENV: "development" }), "http://localhost:3001");
});

test("requires an explicit API URL outside development", () => {
  assert.throws(
    () => resolvePublicApiUrl({ NODE_ENV: "production" }),
    /NEXT_PUBLIC_API_URL is required/,
  );
});

test("normalizes and validates the configured API URL", () => {
  assert.equal(
    resolvePublicApiUrl({
      NODE_ENV: "production",
      NEXT_PUBLIC_API_URL: "https://api.example.com/",
    }),
    "https://api.example.com",
  );
  assert.throws(
    () => resolvePublicApiUrl({
      NODE_ENV: "production",
      NEXT_PUBLIC_API_URL: "javascript:alert(1)",
    }),
    /valid HTTP\(S\) URL/,
  );
});
