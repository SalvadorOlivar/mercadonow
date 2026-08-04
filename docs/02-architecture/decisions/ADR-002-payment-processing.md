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
`PaymentGateway` port. A new attempt is first persisted as `PENDING`. The gateway
is called outside a database transaction using the `PaymentId` as its stable
retry identity. The resulting payment and order state are then persisted in a
transaction. A retry reuses a `PENDING` attempt, returns an `AUTHORIZED` attempt
without charging again, and may create a new attempt after a `FAILED` result.

## Trade-offs

There are two local transactions instead of one, and a crashed request can leave
a visible `PENDING` payment. In return, retries can recover that attempt and no
database transaction spans external I/O. Concurrent requests will require a
stronger idempotency constraint when a real provider is introduced.

## Consequences

- Payment gateways implement a framework-independent application port.
- Authorization rejection is a persisted `FAILED` payment, not an exception.
- Invoice creation accepts only `AUTHORIZED` payments and enforces one invoice
  per payment in both application logic and the existing database constraint.
