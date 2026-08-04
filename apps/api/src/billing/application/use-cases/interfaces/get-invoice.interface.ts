import type {
  InvoiceId,
  InvoiceStatus,
  MoneyDTO,
  OrderId,
  PaymentId,
} from "@mercadonow/shared";

export interface GetInvoiceInput {
  readonly invoiceId: InvoiceId;
}

export interface GetInvoiceOutput {
  readonly invoiceId: InvoiceId;
  readonly orderId: OrderId;
  readonly paymentId: PaymentId;
  readonly status: InvoiceStatus;
  readonly total: MoneyDTO;
}
