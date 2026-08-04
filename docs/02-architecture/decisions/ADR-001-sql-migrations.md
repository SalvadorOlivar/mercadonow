# ADR-001 — PostgreSQL access and SQL migrations

- Status: Accepted
- Date: 2026-08-04
- Scope: API infrastructure

## Context

The Billing MVP needs PostgreSQL persistence and reproducible schema changes.
The domain already exposes repository ports and the API already depends on
`pg`. Introducing an ORM at this point would add entity mappings, conventions
and a second model before persistence requirements are complex enough to
justify them.

## Alternatives

1. Raw SQL through `pg`, with a small migration runner.
2. An ORM such as Prisma or TypeORM with generated/decorated persistence
   models.
3. Manual, unversioned SQL executed by each developer.

## Decision

Use `pg` behind infrastructure adapters and keep migrations as ordered SQL
files. A small runner records the filename and SHA-256 checksum in
`schema_migrations`, serializes concurrent runs with a PostgreSQL advisory lock,
and applies each pending file in its own transaction.

NestJS owns a single application-level `Pool`. Startup performs `SELECT 1` so
an invalid or unavailable database fails fast. Domain entities and repository
ports remain unaware of PostgreSQL.

Application use cases own transaction boundaries through a `TransactionManager`
port. Its PostgreSQL adapter keeps the checked-out client in async-local
context, so every repository called inside the operation uses the same
transaction without receiving a PostgreSQL-specific client.

Applied migrations are immutable. Corrections are introduced as new migration
files rather than editing history.

## Trade-offs

- SQL stays visible and PostgreSQL features remain directly accessible.
- There is no ORM mapping or generated query API; infrastructure adapters must
  map rows explicitly.
- The custom runner is intentionally small and does not support automatic
  down-migrations. Development data can be reset with Docker Compose, while
  forward-only migrations avoid ambiguous production rollbacks.

## Consequences

- Migration files live in `apps/api/database/migrations`.
- `pnpm --filter @mercadonow/api db:migrate` brings a database up to date.
- Repository implementations will inject the shared pool/database service.
- Repository implementations do not begin or commit transactions; application
  use cases invoke `TransactionManager.run` around an atomic operation.
- Repository adapters validate database rows before branding IDs or rehydrating
  aggregates; see ADR-004.
- If schema evolution later requires richer tooling, the SQL files can be
  adopted by a dedicated migration tool without changing the domain.
