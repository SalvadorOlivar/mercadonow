# Billing public API contract

The public contract is defined in `@mercadonow/shared`. The API application
interfaces and NestJS DTOs implement those types, and the web workspace imports
all request, response and error contracts as a compilation check. The generated
OpenAPI document describes the HTTP representation of the same contract.

## Endpoints

| Operation | Request | Success | Expected errors |
| --- | --- | --- | --- |
| `POST /orders` | JSON body: `CreateOrderRequest` | `201 CreateOrderResponse` | `400` validation/domain input |
| `POST /orders/:orderId/payments` | UUID v7 path parameter | `201 CreatePaymentResponse` | `400`, `404`, `409` |
| `POST /orders/:orderId/invoices` | UUID v7 path parameter and `paymentId` body | `201 CreateInvoiceResponse` | `400`, `404`, `409` |
| `GET /invoices/:invoiceId` | UUID v7 path parameter | `200 GetInvoiceResponse` | `400`, `404` |

Money is always `{ amount, currency }`, where `amount` is a non-negative safe
integer in the smallest currency unit. Supported currencies are `ARS`, `USD`
and `EUR`. IDs crossing HTTP are UUID v7 strings; application code converts
them to the branded ID type appropriate for each aggregate.

## Public input limits

The source of truth is `BILLING_CONTRACT_LIMITS` in `@mercadonow/shared`:

| Field | Rule |
| --- | --- |
| `deliveryAddress` | non-whitespace, maximum 500 characters |
| `items` | between 1 and 100 entries |
| `productId` | non-whitespace, maximum 100 characters |
| `quantity` | integer from 1 through 2,147,483,647 |
| `MoneyDTO.amount` | integer from 0 through `Number.MAX_SAFE_INTEGER` |
| currencies and statuses | value must occur in the exported shared constant |

HTTP DTOs reject malformed transport input. Domain entities and value objects
independently enforce the corresponding invariants so non-HTTP callers cannot
construct an invalid aggregate. Nested validation errors use dotted paths such
as `items.0.unitPrice.amount` and never include the rejected value.

## Error envelope

All failures use this shape:

```json
{
  "statusCode": 409,
  "error": {
    "code": "INVOICE_ALREADY_EXISTS",
    "message": "An invoice already exists for payment <paymentId>"
  }
}
```

Expected Billing errors have exhaustive HTTP mappings:

| HTTP | Codes |
| --- | --- |
| `400` | `DOMAIN_VALIDATION_ERROR`, `VALIDATION_ERROR` |
| `404` | `ORDER_NOT_FOUND`, `PAYMENT_NOT_FOUND`, `INVOICE_NOT_FOUND` |
| `409` | `INVALID_STATE_TRANSITION`, `PAYMENT_NOT_AUTHORIZED`, `PAYMENT_ORDER_MISMATCH`, `INVOICE_ALREADY_EXISTS` |
| framework status | `HTTP_ERROR` |
| `500` | `INTERNAL_ERROR` |

Infrastructure adapters translate expected database conflicts to typed Billing
errors. PostgreSQL codes and unexpected exception messages never cross HTTP;
unexpected failures are logged with stack and request context and return a
sanitized `INTERNAL_ERROR`.

## OpenAPI and API versioning

Set `OPENAPI_ENABLED=true` to expose Swagger UI at `/docs` and JSON at
`/docs-json`. It defaults to disabled and should only be enabled deliberately in
each environment. CI creates the document from runtime decorators and verifies
the required paths, responses and component schemas.

The Billing MVP remains temporarily unversioned because it has no external
consumers. Before a stable `/v1` exists, a breaking change must update, in the
same change, the shared types, API/application implementations, frontend
compilation check, OpenAPI verification, tests and this document. Removing or
renaming a field, narrowing accepted input, changing a status/error code, or
changing endpoint/status semantics is breaking. Additive optional fields are
non-breaking. A stable external consumer is the trigger to introduce `/v1`.

## Runtime configuration

The API validates `NODE_ENV`, `PORT`, `DATABASE_URL`, `CORS_ORIGINS` and
`OPENAPI_ENABLED` at startup. Development alone defaults CORS to
`http://localhost:3000`; every other environment requires an explicit HTTP(S)
allowlist. The web build validates `NEXT_PUBLIC_API_URL` and only defaults to
`http://localhost:3001` in development.
