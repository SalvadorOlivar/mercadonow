# ADR-000 — Foundation decisions

- Status: Accepted
- Date: 2026-08-04
- Scope: whole monorepo

## Context

MercadoNow starts as a Billing MVP with a Node.js/NestJS backend, Next.js frontend,
and PostgreSQL. The project is a learning lab aimed at Fullstack/Backend/Architect
roles, so the value is in *why* each decision is made, not only in shipping code.

Before any feature code, four cheap-to-change-now / expensive-to-change-later
decisions had to be fixed so all later work is consistent.

## Decisions

### D1 — Monorepo with pnpm workspaces

**Layout**

```
apps/api      NestJS backend (modular monolith)
apps/web      Next.js App Router frontend
packages/shared   Pure-TypeScript contracts shared by api and web
```

**Rationale.** Both apps must agree on DTOs and status unions. A monorepo lets
`@mercadonow/shared` be imported as source via path aliases, with no publishing
step and no contract drift.

**Alternatives considered.** Separate folders `backend/` + `frontend/` with
copy-pasted types — rejected because of drift risk and duplicated status enums.

**Trade-offs.** Slightly more tooling (workspace filters) vs. a single source of
truth for the contract.

---

### D2 — Rich domain model (DDD tactical)

**Decision.** Entities protect their invariants in the constructor and expose
behavioural methods; no public setters. Value objects (`Money`, `OrderId`,
`OrderStatus`) carry type safety and rules. Use cases in `application/`
orchestrate the domain through repository *ports* (interfaces) defined in
`domain/`.

**Rationale.** The target roles expect SOLID, Clean Architecture and DDD. An
anemic CRUD model would teach almost none of that.

**Alternatives considered.** Anemic entities + services — simpler, but turns
the domain into a bag of data and hides business rules in services.

**Trade-offs.** More code and more discipline; in return, invariants are
enforced by the compiler and tests focus on the domain, not on plumbing.

---

### D3 — Money as integer cents + `Money` value object

**Decision.** Money is represented internally as an integer number of the
smallest currency unit (cents). A `Money` value object in the API domain layer
enforces non-negative / integer / currency rules. The wire contract
(`MoneyDTO` in `@mercadonow/shared`) carries `{ amount: number, currency }`.

**Rationale.** Floating-point money is the textbook source of billing bugs.
Integer cents have exact arithmetic, simple equality, and trivial PostgreSQL
storage (`bigint` / `integer`).

**Alternatives considered.** `numeric`/`decimal.js` — faithful to PG but adds
a dependency and friction at every serialization boundary.

**Trade-offs.** Conversion at presentation boundaries (e.g. display `12.34`
from `1234` cents). Encapsulated once in the `Money` VO, so the rest of the
code never sees decimals.

---

### D4 — Typed domain exceptions + NestJS exception filter

**Decision.** Domain and application layers throw typed exception classes
(e.g. `OrderNotFoundError`, `InvalidOrderTransitionError`), each with a stable
code and message. A NestJS exception filter in `presentation/` maps them to
HTTP status codes and a consistent JSON envelope. Domain never imports NestJS.

**Rationale.** Idiomatic TypeScript, easy to log and trace, and keeps the
domain framework-agnostic (the filter is the only place that knows HTTP).

**Alternatives considered.** `Result<T, E>` (railway-oriented) — explicit but
verbose across every call site; more natural in languages without exceptions.

**Trade-offs.** Exceptions are control flow. Mitigated by typing them and by
unit-testing use cases for the specific thrown types.

---

### D5 — UUID v7 for entity IDs

**Decision.** All aggregate IDs are UUID v7 (time-ordered). IDs are branded
strings (`Brand<string, "OrderId">`) so the compiler rejects passing an
`OrderId` where a `PaymentId` is expected.

**Rationale.** v7 is sortable (good for indexes and natural chronological
order) and does not leak cardinality like v4 might at scale. Branding is free
at runtime and catches a common class of bugs.

**Alternatives considered.** Auto-increment (couples to DB order, leaks
cardinality), UUID v4 (not sortable).

**Trade-offs.** Wider keys (16 bytes) vs. int; negligible for this project's
scale.

## Consequences

- `apps/api/src/billing` uses four layers: `domain`, `application`,
  `infrastructure`, `presentation`. The dependency direction is
  `presentation -> application -> domain <- infrastructure`. The domain layer
  imports nothing from outer layers and nothing framework-specific.
- `@mercadonow/shared` is pure TypeScript (no NestJS, no React) so both apps
  can import it without dragging framework dependencies.
- Money handling crosses boundaries as integer cents; only the `Money` VO and
  the presentation layer format decimals.
- Errors cross the domain/HTTP boundary in exactly one place: the exception
  filter.

## Future evolution

None of these decisions block the planned evolution (Clean Architecture deepening,
event-driven, observability, Docker, K8s, Cloud, CI/CD). D2/D3/D4 in particular
are the foundation that makes the later phases clean instead of rewrite-heavy.