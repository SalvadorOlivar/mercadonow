# ADR-006 — Hexagonal adapters and TypeORM persistence

- Status: Accepted
- Date: 2026-08-05
- Scope: Billing adapters and PostgreSQL persistence
- Issue: #42

## Context

Billing used `presentation/` for HTTP and grouped every outbound implementation
directly under `infrastructure/`. Persistence relied on handwritten `pg` queries,
a custom transaction context and a custom SQL migration runner. The dependency
direction was clean, but the directory names did not make inbound and outbound
adapter roles explicit.

## Alternatives

1. Move only the controller under infrastructure. Rejected because persistence,
   gateways and ID generators would keep a different taxonomy.
2. Adopt `adapters/in` and `adapters/out` while retaining direct `pg`. Rejected
   because #42 deliberately includes learning and exercising TypeORM.
3. Adopt the complete adapter topology and replace direct `pg` access with
   TypeORM while keeping ORM models outside the domain. Chosen.

## Decision

- Inbound HTTP controllers and DTOs live under
  `infrastructure/adapters/in/http`.
- PostgreSQL/TypeORM, integration and ID adapters live under
  `infrastructure/adapters/out`, grouped by technology.
- TypeORM persistence entities are not domain entities. Explicit mappers treat
  hydrated values as untrusted before calling aggregate `rehydrate` methods.
- `bigint` money columns remain strings at the persistence boundary and are
  converted only after safe-integer validation.
- The application-owned `TransactionManager` port keeps its callback-only API.
  Its TypeORM adapter uses `AsyncLocalStorage<EntityManager>` so repositories
  transparently select the active transactional manager.
- TypeORM migrations are the only schema mechanism. `synchronize` and automatic
  migration execution at application startup remain disabled.
- The global HTTP validation pipe and exception filter remain in `common/http`
  because they apply to the whole API, not only Billing.

## Trade-offs

- TypeORM adds metadata and framework integration, but removes repeated query
  plumbing and exposes a production-style ORM adapter without coupling domain
  objects to decorators.
- Async-local transaction propagation is infrastructure complexity, but avoids
  leaking `EntityManager` through application and repository ports.
- Existing databases managed by `schema_migrations` are not adopted in place.
  This is acceptable for the learning lab, but requires a one-time local reset.

## Consequences

- ADR-001's direct-`pg` repository and custom migration-runner decision is
  superseded. PostgreSQL remains the database and the schema remains equivalent.
- ADR-000 and ADR-003 retain their inward dependency rule, with `presentation`
  replaced by an inbound HTTP adapter and infrastructure split into `in`/`out`.
- ADR-005's public contract and global `common/http` boundary are unchanged.
- Architecture probes enforce that inbound and outbound adapters cannot import
  one another; `BillingModule` remains their composition root.
- Before the first TypeORM migration, local development must run
  `docker compose down -v`, restart PostgreSQL and run `db:migrate`.
