import type { InvoicePort } from "../ports/out/invoice.port";
import { InvoiceNotFoundError } from "../errors/billing-application.errors";
import type {
  GetInvoiceInput,
  GetInvoiceOutput,
} from "./interfaces/get-invoice.interface";

export class GetInvoice {
  constructor(private readonly invoiceRepository: InvoicePort) {}

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
