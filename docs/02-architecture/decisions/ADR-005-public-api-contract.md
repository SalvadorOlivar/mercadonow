# ADR-005 — Verifiable public API contract

- Status: Accepted
- Date: 2026-08-04
- Scope: Billing HTTP boundary, shared contracts and runtime configuration

> ADR-006 moves Billing HTTP DTOs/controllers to `adapters/in/http`; the public
> contract and the application-wide `common/http` filter remain unchanged.

## Context

Billing request/response types were split between application and presentation,
the frontend had no compilation proof that it could consume them, and the API
had no machine-readable HTTP contract. The Billing-specific catch-all filter
also handled application-wide framework and unexpected errors, while accepting
an open set of string codes. Configuration and CORS were not centrally
validated.

## Alternatives

1. Maintain TypeScript types and OpenAPI as independent definitions. This is
   simple initially but permits contract drift.
2. Generate every TypeScript type from OpenAPI. This adds a generation step and
   makes framework DTO validation less direct for the current monorepo.
3. Keep pure TypeScript contracts in `@mercadonow/shared`, have application and
   HTTP DTOs implement them, and generate OpenAPI from decorated runtime DTOs.

## Decision

Use alternative 3. Public Billing requests, responses, enums, limits and error
codes live in the framework-free shared package. Application interfaces and
NestJS DTO classes remain the behavioral/runtime implementations of those
contracts. Both API and web compilation include the shared types.

The global exception filter moves from Billing presentation to `common/http`.
Only subclasses of the closed `BillingError` taxonomy are treated as expected
business failures, with an exhaustive code-to-status mapping. Infrastructure
adapters translate known persistence conflicts to those errors. Unknown errors
are logged internally and sanitized at HTTP.

OpenAPI is generated from controller and DTO metadata and exposed only when
`OPENAPI_ENABLED` is true. Automated tests verify its four paths and required
schemas. Routes remain unversioned during the internal MVP; the first stable
external consumer triggers `/v1`.

Runtime environment values are parsed once during application configuration.
CORS defaults to the local frontend only in development and requires an
explicit allowlist elsewhere.

## Trade-offs

- Some structural information appears both as a TypeScript interface and as
  decorator metadata because interfaces do not exist at runtime.
- Response DTO classes add presentation code, but let OpenAPI reference stable
  schemas instead of anonymous objects.
- A closed error taxonomy requires deliberate updates when adding a new
  expected failure, which is intentional compiler pressure.
- Temporarily unversioned routes keep the MVP small but prohibit claiming a
  stable external contract until `/v1` is introduced.

## Consequences

- Contract changes must update shared types, implementations, frontend compile
  checks, OpenAPI tests and contract documentation together.
- The location statement in ADR-000 D4 is superseded: typed domain/application
  exceptions remain the strategy, but the catch-all HTTP filter is global in
  `common/http`, not Billing presentation.
- PostgreSQL error codes are adapter details and must not become public error
  codes.
- Invalid runtime configuration fails startup/build before serving traffic.
