# ADR-003 — Enforceable architecture boundaries and port ownership

- Status: Accepted
- Date: 2026-08-04
- Scope: Billing module and shared contracts

> ADR-006 refines `presentation` and `infrastructure` into explicit inbound and
> outbound adapters. The ownership and dependency principles below still apply.

## Context

ADR-000 established four Billing layers, but its compact dependency diagram
only showed infrastructure pointing to domain. The implementation already had
infrastructure adapters for application-owned capabilities such as
`PaymentGateway` and ID generation. At the same time, `TransactionManager`
lived beside domain repositories even though transactions coordinate an
application operation and are not a domain concept.

The dependency rules were documented but enforced only by review. A future
import from domain to NestJS or from application to a PostgreSQL adapter could
therefore compile and silently erode the architecture.

## Alternatives

1. Put every outbound port in domain and preserve the old diagram. Rejected
   because gateway, ID generation and transaction orchestration are not domain
   concepts.
2. Keep ownership informal and rely on code review. Rejected because the
   dependency direction is cheap to automate and architectural drift is easy
   to miss in a growing module.
3. Assign each port to the layer that needs it and enforce the resulting
   dependency matrix. Chosen because ownership expresses intent while adapters
   still point inward.

## Decision

Allowed compile-time dependencies are:

```text
presentation  -> application -> domain
infrastructure -> application / domain
composition root -> presentation / infrastructure / application / domain
```

- Domain owns aggregates, value objects and domain errors. It imports no
  framework, I/O package or outer layer.
- Application owns use cases and outbound ports: repositories, transaction
  management, payment gateways and ID generation. It may depend on domain but
  never on a concrete adapter or presentation.
- Infrastructure implements application ports and may depend inward on the
  application and domain layers. It never imports presentation.
- Presentation translates HTTP to application contracts. Business rules remain
  outside controllers and DTOs.
- `BillingModule` is the composition root and is the only Billing file expected
  to import all layers for dependency injection wiring.
- `@mercadonow/shared` remains framework- and runtime-agnostic.

ESLint `no-restricted-imports` rules enforce the matrix. A small executable set
of invalid-import probes verifies that each restriction is active, so a config
regression fails the quality gate.

## Trade-offs

- Built-in ESLint restrictions avoid another dependency, but relative import
  patterns must be extended if layer nesting becomes significantly deeper.
- Repository ports remain in domain while infrastructure also implements
  application ports. This produces two inward targets, but keeps each port next
  to the policy that owns it.
- The composition root is intentionally coupled to concrete implementations;
  hiding that coupling would only move wiring elsewhere.

## Consequences

- `TransactionManager` lives in `application/ports`.
- Architecture violations fail local lint and CI instead of relying solely on
  review.
- Apps may use framework-specific lint configurations; the Next.js workspace
  uses its official Core Web Vitals and TypeScript presets.
- New modules must document any different dependency matrix rather than
  weakening these restrictions globally.
