import type {
  GetInvoiceRequest,
  GetInvoiceResponse,
  InvoiceId,
} from "@mercadonow/shared";

export interface GetInvoiceInput extends GetInvoiceRequest {
  readonly invoiceId: InvoiceId;
}

export type GetInvoiceOutput = GetInvoiceResponse;
