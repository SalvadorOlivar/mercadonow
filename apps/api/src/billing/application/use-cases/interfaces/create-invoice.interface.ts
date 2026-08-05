import type {
  CreateInvoiceRequest,
  CreateInvoiceResponse,
  OrderId,
  PaymentId,
} from "@mercadonow/shared";

export interface CreateInvoiceInput extends CreateInvoiceRequest {
  readonly orderId: OrderId;
  readonly paymentId: PaymentId;
}

export type CreateInvoiceOutput = CreateInvoiceResponse;
