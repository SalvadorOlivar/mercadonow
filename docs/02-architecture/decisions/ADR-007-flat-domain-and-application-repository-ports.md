# ADR-007 — Flat domain and application-owned repository ports

- Status: Accepted
- Date: 2026-08-06
- Scope: Billing domain and application boundaries

## Context

Billing grouped aggregates under `domain/entities` and placed repository ports
under `domain/repositories`. This made a small domain unnecessarily deep and
made persistence requirements appear to be domain concepts.

## Alternatives

1. Keep the existing tactical-DDD folder taxonomy.
2. Flatten only the aggregate files while retaining repository ports in domain.
3. Flatten each aggregate and move repository ports to the application outbound
   ports. Chosen.

## Decision

- Each Billing aggregate lives in `domain/invoice.ts`, `domain/order.ts`, or
  `domain/payment.ts`.
- Domain interfaces live under `domain/interfaces`, grouped into one file per
  aggregate: invoice, order, and payment.
- Domain retains only business behavior, value objects, and domain errors.
- Repository contracts and their injection tokens live in
  `application/ports/out`, alongside the other capabilities required by use
  cases.
- TypeORM repository implementations remain outbound infrastructure adapters.

## Trade-offs

- The flat domain is easier to navigate at the current scale, but a larger
  domain may eventually justify feature subfolders.
- Repository ports no longer sit beside the aggregates they persist, but their
  ownership now reflects the application use cases that consume them.

## Consequences

- ADR-000 D2 and ADR-003 are superseded only where they assign repository-port
  ownership to domain; their rich-domain and inward-dependency decisions remain.
- Domain cannot import repository contracts. Application may import domain, and
  outbound adapters may implement application ports while importing domain
  aggregates for mapping.
