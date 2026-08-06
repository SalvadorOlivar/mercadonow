import type { InvoiceId, OrderId, PaymentId } from "@mercadonow/shared";

import type { Invoice } from "../../../domain/invoice";

export const INVOICE_REPOSITORY = Symbol("INVOICE_REPOSITORY");

export interface InvoicePort {
  findById(id: InvoiceId): Promise<Invoice | null>;
  findByOrderId(orderId: OrderId): Promise<Invoice | null>;
  findByPaymentId(paymentId: PaymentId): Promise<Invoice | null>;
  save(invoice: Invoice): Promise<void>;
}
