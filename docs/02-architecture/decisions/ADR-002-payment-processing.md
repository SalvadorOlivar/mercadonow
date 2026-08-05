# ADR-002 — Payment processing boundary and retries

- Status: Accepted
- Date: 2026-08-04
- Scope: Billing application layer

## Context

Issue #23 is named `CreatePayment`, while UC-003 requires processing a payment
and the invoice flow requires an authorized payment. Calling an external payment
provider inside a database transaction would keep database resources locked
during network I/O and cannot make the provider call atomic with PostgreSQL.

## Alternatives

- Create only a `PENDING` payment and add a separate processing use case. This
  leaves the current Billing MVP happy path incomplete and has no milestone issue.
- Call the gateway inside one database transaction. This looks atomic locally,
  but the external side effect cannot roll back and the transaction may remain
  open during a slow provider call.
- Persist an attempt, call the gateway, then persist the outcome. This exposes a
  recoverable `PENDING` state while keeping network I/O outside transactions.

## Decision

`CreatePayment` also processes the payment through an application-layer
`PaymentGateway` port. A new logical attempt is first persisted as `PENDING`.
The attempt's `PaymentId` is its stable idempotency identity at both the database
and provider boundaries. The gateway is called outside a database transaction
with that identity, so repeated calls for the same attempt must resolve to one
logical provider charge. The resulting payment and order state are then
persisted in a transaction.

PostgreSQL owns the final concurrency guarantee through a partial unique index
on `payments(order_id)` for `PENDING` and `AUTHORIZED` rows. If concurrent
requests generate different IDs, only one claim is persisted; the loser reloads
and reuses the winner's `PaymentId`. This avoids holding a transaction open
during provider I/O while making the pre-check an optimization rather than the
correctness boundary.

Retry semantics are explicit:

- `PENDING`: reuse its `PaymentId` and safely repeat the idempotent gateway call.
- `AUTHORIZED`: return the persisted result without calling the gateway.
- `FAILED`: the logical attempt is complete; a retry may claim a new `PaymentId`.

## Trade-offs

There are two local transactions instead of one, and a crashed request can leave
a visible `PENDING` payment. In return, retries can recover that attempt and no
database transaction spans external I/O. A real provider adapter must honor the
`PaymentId` as its idempotency key; the local sandbox deterministically does so.

## Consequences

- Payment gateways implement a framework-independent application port.
- At most one `PENDING` or `AUTHORIZED` payment exists per order; historical
  `FAILED` attempts remain available.
- Authorization rejection is a persisted `FAILED` payment, not an exception.
- Invoice creation accepts only `AUTHORIZED` payments and enforces one invoice
  per payment in both application logic and the existing database constraint.
