import type { InvoiceId, OrderId, PaymentId } from "@mercadonow/shared";

export class OrderNotFoundError extends Error {
  readonly code = "ORDER_NOT_FOUND";

  constructor(orderId: OrderId) {
    super(`Order ${orderId} was not found`);
    this.name = "OrderNotFoundError";
  }
}

export class PaymentNotFoundError extends Error {
  readonly code = "PAYMENT_NOT_FOUND";

  constructor(paymentId: PaymentId) {
    super(`Payment ${paymentId} was not found`);
    this.name = "PaymentNotFoundError";
  }
}

export class InvoiceNotFoundError extends Error {
  readonly code = "INVOICE_NOT_FOUND";

  constructor(invoiceId: InvoiceId) {
    super(`Invoice ${invoiceId} was not found`);
    this.name = "InvoiceNotFoundError";
  }
}

export class PaymentNotAuthorizedError extends Error {
  readonly code = "PAYMENT_NOT_AUTHORIZED";

  constructor(paymentId: PaymentId) {
    super(`Payment ${paymentId} is not authorized`);
    this.name = "PaymentNotAuthorizedError";
  }
}

export class PaymentOrderMismatchError extends Error {
  readonly code = "PAYMENT_ORDER_MISMATCH";

  constructor(paymentId: PaymentId, orderId: OrderId) {
    super(`Payment ${paymentId} does not belong to order ${orderId}`);
    this.name = "PaymentOrderMismatchError";
  }
}

export class InvoiceAlreadyExistsError extends Error {
  readonly code = "INVOICE_ALREADY_EXISTS";

  constructor(paymentId: PaymentId) {
    super(`An invoice already exists for payment ${paymentId}`);
    this.name = "InvoiceAlreadyExistsError";
  }
}
