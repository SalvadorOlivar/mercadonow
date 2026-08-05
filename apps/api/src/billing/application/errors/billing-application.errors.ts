import type { InvoiceId, OrderId, PaymentId } from "@mercadonow/shared";
import { BillingError } from "../../domain/errors/billing.error";

export class OrderNotFoundError extends BillingError {
  readonly code = "ORDER_NOT_FOUND" as const;

  constructor(orderId: OrderId) {
    super(`Order ${orderId} was not found`);
    this.name = "OrderNotFoundError";
  }
}

export class PaymentNotFoundError extends BillingError {
  readonly code = "PAYMENT_NOT_FOUND" as const;

  constructor(paymentId: PaymentId) {
    super(`Payment ${paymentId} was not found`);
    this.name = "PaymentNotFoundError";
  }
}

export class InvoiceNotFoundError extends BillingError {
  readonly code = "INVOICE_NOT_FOUND" as const;

  constructor(invoiceId: InvoiceId) {
    super(`Invoice ${invoiceId} was not found`);
    this.name = "InvoiceNotFoundError";
  }
}

export class PaymentNotAuthorizedError extends BillingError {
  readonly code = "PAYMENT_NOT_AUTHORIZED" as const;

  constructor(paymentId: PaymentId) {
    super(`Payment ${paymentId} is not authorized`);
    this.name = "PaymentNotAuthorizedError";
  }
}

export class PaymentOrderMismatchError extends BillingError {
  readonly code = "PAYMENT_ORDER_MISMATCH" as const;

  constructor(paymentId: PaymentId, orderId: OrderId) {
    super(`Payment ${paymentId} does not belong to order ${orderId}`);
    this.name = "PaymentOrderMismatchError";
  }
}

export class InvoiceAlreadyExistsError extends BillingError {
  readonly code = "INVOICE_ALREADY_EXISTS" as const;

  constructor(paymentId: PaymentId) {
    super(`An invoice already exists for payment ${paymentId}`);
    this.name = "InvoiceAlreadyExistsError";
  }
}
