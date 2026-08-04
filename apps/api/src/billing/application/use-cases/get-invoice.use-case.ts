import type {
  InvoiceId,
  InvoiceStatus,
  MoneyDTO,
  OrderId,
  PaymentId,
} from "@mercadonow/shared";

import type { InvoiceRepository } from "../../domain/repositories/invoice.repository";
import { InvoiceNotFoundError } from "../errors/billing-application.errors";

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

export class GetInvoice {
  constructor(private readonly invoiceRepository: InvoiceRepository) {}

  async execute(input: GetInvoiceInput): Promise<GetInvoiceOutput> {
    const invoice = await this.invoiceRepository.findById(input.invoiceId);
    if (invoice === null) throw new InvoiceNotFoundError(input.invoiceId);

    return {
      invoiceId: invoice.id,
      orderId: invoice.orderId,
      paymentId: invoice.paymentId,
      status: invoice.status,
      total: invoice.total.toDTO(),
    };
  }
}
