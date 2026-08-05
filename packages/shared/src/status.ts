/**
 * Status unions — single source of truth for state machine values.
 *
 * Mirrors docs/01-product/domain.md. When a status is added or renamed,
 * update domain.md AND this file; both sides (FE + BE) import from here.
 */

export const ORDER_STATUSES = [
  "PENDING_PAYMENT",
  "PAID",
  "CANCELLED",
  "COMPLETED",
] as const;

export const PAYMENT_STATUSES = [
  "PENDING",
  "AUTHORIZED",
  "FAILED",
  "REFUNDED",
] as const;

export const INVOICE_STATUSES = [
  "DRAFT",
  "ISSUED",
  "PAID",
  "CANCELLED",
] as const;

export type OrderStatus = (typeof ORDER_STATUSES)[number];
export type PaymentStatus = (typeof PAYMENT_STATUSES)[number];
export type InvoiceStatus = (typeof INVOICE_STATUSES)[number];
