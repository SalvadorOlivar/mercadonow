import type { InvoiceId, OrderId } from "@mercadonow/shared";

import type { Invoice } from "../entities/invoice.entity";

export const INVOICE_REPOSITORY = Symbol("INVOICE_REPOSITORY");

export interface InvoiceRepository {
  findById(id: InvoiceId): Promise<Invoice | null>;
  findByOrderId(orderId: OrderId): Promise<Invoice | null>;
  save(invoice: Invoice): Promise<void>;
}
