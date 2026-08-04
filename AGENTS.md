# AGENTS.md

Compact guide for OpenCode sessions working in this repo. Read this first.

## What this project is

MercadoNow — a **fictional billing platform** and learning lab (not a real
product). Started as preparation for a PedidosYa-style "Software Engineer
Fullstack — Billing" role. It evolves incrementally from a modular monolith
toward event-driven / K8s / Cloud. **Do not over-engineer**: introduce a new
technology only when a real problem justifies it (see `docs/01-product/vision.md`
and ADR-000).

Current phase: **Billing MVP**. GitHub Milestone "Billing MVP" already has the
issues (#1–#30). Do not recreate milestone or issues — work from existing ones.

## Repo layout

pnpm monorepo. Three workspaces:

- `apps/api` — NestJS 11, TypeScript strict, modular monolith. Port 3001.
- `apps/web` — Next.js 15 App Router, React 19. Port 3000.
- `packages/shared` — pure-TS contracts (DTOs, status unions, branded IDs).
  Consumed as **source** via path aliases; never compiled/published. Never
  import NestJS or React here.

Workspace package names: `@mercadonow/api`, `@mercadonow/web`,
`@mercadonow/shared`. Reference a workspace in `package.json` as
`"workspace:*"`.

## Commands

Run from repo root:

```bash
pnpm install                  # install all workspaces
pnpm dev:api                  # NestJS watch mode (port 3001)
pnpm dev:web                  # Next.js dev (port 3000)
pnpm -r typecheck             # typecheck every workspace
pnpm -r lint
pnpm -r test                  # jest per workspace
pnpm verify                   # full local/CI gate, including integration + E2E
pnpm --filter @mercadonow/api test                # one workspace only
pnpm --filter @mercadonow/api test -- <pattern>   # single test file/pattern
```

PostgreSQL for dev:

```bash
docker compose up -d postgres          # start
docker compose down                    # stop
docker compose down -v                 # stop + wipe data volume
```

pnpm quirks (pnpm 11): build-script approval is required for
`@nestjs/core`, `sharp`, `unrs-resolver`. They are listed under
`onlyBuiltDependencies` in `pnpm-workspace.yaml`. If `pnpm install` or any
`pnpm --filter`/`pnpm -r` command exits with `ERR_PNPM_IGNORED_BUILDS`, run
`pnpm approve-builds` (or `pnpm config set dangerously-allow-all-builds true`
on a fresh machine). `verify-deps-before-run` is disabled so commands don't
re-trigger an install check on every run.

## Architecture rules (enforced by review, not tooling yet)

`apps/api/src/billing` has four layers. **Dependency direction is one-way:**

```
presentation -> application -> domain
infrastructure -> application / domain
```

`BillingModule` is the composition root and may import every layer. Infrastructure
depends inward on the outbound ports it implements; it never imports presentation.

- `domain/` — entities, value objects, domain errors, repository PORTS
  (interfaces). **Must not import** NestJS, `pg`, or anything from outer layers.
- `application/` — one use-case class per operation plus orchestration ports
  such as transactions, gateways and ID generation. Depends on domain. Owns
  the transaction boundary.
- `infrastructure/` — adapters implementing domain/application ports (PG
  repositories, transactions, gateways and ID generators).
- `presentation/` — thin NestJS controllers, DTOs, the exception filter.
  No business logic.

Controllers stay thin: HTTP → DTO → use case. Repositories do not own
transactions (use cases do).

## Conventions that differ from defaults

- **Money**: integer cents everywhere. No floats. The `Money` VO lives in
  `apps/api/src/billing/domain`; the wire shape is `MoneyDTO` in
  `@mercadonow/shared`. Format decimals only at presentation.
- **Errors**: domain/application throw **typed exception classes**
  (`OrderNotFoundError`, etc.). A single NestJS exception filter maps them to
  HTTP. Domain never imports NestJS. Do not use `Result<T, E>`.
- **IDs**: UUID v7, branded strings (`Brand<string, "OrderId">`) from
  `@mercadonow/shared`. Never pass an `OrderId` where a `PaymentId` is expected.
- **Status enums**: single source of truth is `@mercadonow/shared` (`OrderStatus`,
  `PaymentStatus`, `InvoiceStatus`). When a status changes, update
  `docs/01-product/domain.md` AND the shared package — both sides import from
  shared.
- **TypeScript**: `strict: true` + `noUncheckedIndexedAccess` everywhere.

## Docs & decisions

- `docs/01-product/` — vision, requirements, domain model, roadmap.
- `docs/02-architecture/decisions/ADR-*.md` — architectural decisions. Always
  read ADR-000 before touching structure or conventions. Record a new ADR for
  any non-trivial decision (Context / Alternatives / Decision / Trade-offs /
  Consequences).

## Workflow expectation

Work in small steps tied to a milestone issue. Commit message format:
`feat(billing): #19 Order entity` (scope = module, issue number referenced).
Do not chain multiple MVP stages without a review/checkpoint in between.

## Environment

Copy `.env.example` → `.env`. Loaded by `apps/api` via `@nestjs/config`
(`ConfigModule.forRoot` is global). `DATABASE_URL` points at the docker-compose
PostgreSQL. `apps/web` reads `NEXT_PUBLIC_API_URL`.
