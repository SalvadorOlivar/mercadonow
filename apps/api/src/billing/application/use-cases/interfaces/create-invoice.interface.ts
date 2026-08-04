import type {
  InvoiceId,
  InvoiceStatus,
  MoneyDTO,
  OrderId,
  PaymentId,
} from "@mercadonow/shared";

export interface CreateInvoiceInput {
  readonly orderId: OrderId;
  readonly paymentId: PaymentId;
}

export interface CreateInvoiceOutput {
  readonly invoiceId: InvoiceId;
  readonly orderId: OrderId;
  readonly paymentId: PaymentId;
  readonly status: InvoiceStatus;
  readonly total: MoneyDTO;
}
