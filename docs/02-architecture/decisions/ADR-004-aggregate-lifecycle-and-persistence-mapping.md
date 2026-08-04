# ADR-004 — Aggregate lifecycle and validated persistence mapping

- Status: Accepted
- Date: 2026-08-04
- Scope: Billing domain and PostgreSQL adapters

## Context

The Billing entities originally exposed one public constructor with an optional
status. The same API created new aggregates and reconstructed persisted ones.
That made lifecycle intent ambiguous and allowed impossible combinations such
as an `AUTHORIZED` payment without a provider reference.

PostgreSQL repository row interfaces also declared IDs, enums and currencies as
if TypeScript could verify database responses at runtime. `bigint` values were
converted with `Number()` without checking JavaScript's safe integer limit, and
the stored order total was ignored while the domain recalculated it from items.

## Alternatives

1. Keep public constructors and rely on callers to pass coherent state.
   Rejected because every adapter and test would remain able to bypass lifecycle
   invariants accidentally.
2. Use a persistence-only constructor or mutate state after construction.
   Rejected because either exposes an unsafe API or replays transitions that did
   not occur in the current process.
3. Introduce separate `create` and `rehydrate` factories and validate every
   database value before branding or constructing domain objects. Chosen because
   lifecycle intent and trust boundaries become explicit without an ORM.

## Decision

- `Order.create`, `Payment.create`, and `Invoice.create` always start in their
  initial lifecycle state. Callers cannot provide a status.
- `rehydrate` requires an explicit status and validates the complete persisted
  state without replaying transitions.
- `Payment` requires a non-blank provider reference in `AUTHORIZED` and
  `REFUNDED`; `PENDING` and `FAILED` forbid one.
- Aggregate collections are copied and frozen so caller-owned arrays or item
  objects cannot mutate entity state.
- PostgreSQL values are treated as `unknown` until runtime parsers validate UUID
  v7, status, currency, text, integer quantities and bigint money amounts.
- A bigint outside `Number.MAX_SAFE_INTEGER` is rejected rather than rounded.
  This preserves ADR-000's integer-cents representation.
- The order total is derived from `order_items` by the domain. The denormalized
  value in `orders.total_amount/currency` must equal that derived total on every
  read; disagreement is treated as persisted-data corruption.
- Invalid rows throw `PersistenceMappingError` with source/field context and the
  original cause. It remains an unexpected infrastructure failure and must not
  expose raw database values through HTTP.

## Trade-offs

- Factories add a small amount of code and require call sites to state their
  intent explicitly.
- Runtime validation duplicates selected PostgreSQL constraints, but protects
  against legacy data, manual changes, future migration mistakes and unsafe
  driver conversions.
- Reading an order recalculates and compares its total. This cost is negligible
  for the MVP and detects a billing integrity problem early.
- `number` cents impose a maximum safe amount. Supporting larger values would
  require a deliberate move to bigint/decimal across domain and wire contracts.

## Consequences

- Application use cases only call `create`; PostgreSQL adapters only call
  `rehydrate`.
- Repository ports and transaction ownership do not change.
- Mapping tests cover invalid runtime values, and PostgreSQL integration tests
  cover round trips, updates, item ordering and corrupted totals.
- Adding aggregate fields requires updating both factories and the relevant row
  mapper deliberately.
