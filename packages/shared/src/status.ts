/**
 * Status unions — single source of truth for state machine values.
 *
 * Mirrors docs/01-product/domain.md. When a status is added or renamed,
 * update domain.md AND this file; both sides (FE + BE) import from here.
 */

export type OrderStatus =
  | "PENDING_PAYMENT"
  | "PAID"
  | "CANCELLED"
  | "COMPLETED";

export type PaymentStatus =
  | "PENDING"
  | "AUTHORIZED"
  | "FAILED"
  | "REFUNDED";

export type InvoiceStatus =
  | "DRAFT"
  | "ISSUED"
  | "PAID"
  | "CANCELLED";

export const ORDER_STATUSES: readonly OrderStatus[] = [
  "PENDING_PAYMENT",
  "PAID",
  "CANCELLED",
  "COMPLETED",
] as const;

export const PAYMENT_STATUSES: readonly PaymentStatus[] = [
  "PENDING",
  "AUTHORIZED",
  "FAILED",
  "REFUNDED",
] as const;

export const INVOICE_STATUSES: readonly InvoiceStatus[] = [
  "DRAFT",
  "ISSUED",
  "PAID",
  "CANCELLED",
] as const;