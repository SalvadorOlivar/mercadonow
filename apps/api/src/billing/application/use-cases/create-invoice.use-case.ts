import type { InvoiceId } from "@mercadonow/shared";

import { Invoice } from "../../domain/invoice";
import type { InvoicePort } from "../ports/out/invoice.port";
import type { OrderPort } from "../ports/out/order.port";
import type { PaymentPort } from "../ports/out/payment.port";
import {
  InvoiceAlreadyExistsError,
  OrderNotFoundError,
  PaymentNotAuthorizedError,
  PaymentNotFoundError,
  PaymentOrderMismatchError,
} from "../errors/billing-application.errors";
import type { IdGenerator } from "../ports/out/id-generator.port";
import type { TransactionManagerPort } from "../ports/out/transaction-manager.port";
import type {
  CreateInvoiceInput,
  CreateInvoiceOutput,
} from "./interfaces/create-invoice.interface";

export class CreateInvoice {
  constructor(
    private readonly OrderPort: OrderPort,
    private readonly PaymentPort: PaymentPort,
    private readonly InvoicePort: InvoicePort,
    private readonly transactionManagerPort: TransactionManagerPort,
    private readonly invoiceIdGenerator: IdGenerator<InvoiceId>,
  ) {}

  async execute(input: CreateInvoiceInput): Promise<CreateInvoiceOutput> {
    const order = await this.OrderPort.findById(input.orderId);
    if (order === null) throw new OrderNotFoundError(input.orderId);

    const payment = await this.PaymentPort.findById(input.paymentId);
    if (payment === null) throw new PaymentNotFoundError(input.paymentId);
    if (payment.orderId !== order.id) {
      throw new PaymentOrderMismatchError(payment.id, order.id);
    }
    if (payment.status !== "AUTHORIZED") {
      throw new PaymentNotAuthorizedError(payment.id);
    }

    const existing = await this.InvoicePort.findByPaymentId(payment.id);
    if (existing !== null) return this.toOutput(existing);

    const invoice = Invoice.create({
      id: this.invoiceIdGenerator.generate(),
      orderId: order.id,
      paymentId: payment.id,
      total: payment.amount,
    });
    invoice.issue();

    try {
      await this.transactionManagerPort.run(() => this.InvoicePort.save(invoice));
    } catch (error) {
      if (!(error instanceof InvoiceAlreadyExistsError)) throw error;

      // The failed INSERT transaction has rolled back before this read. The
      // unique payment_id constraint guarantees that the winning invoice is
      // now the stable idempotent result.
      const concurrentInvoice = await this.InvoicePort.findByPaymentId(
        payment.id,
      );
      if (concurrentInvoice === null) throw error;
      return this.toOutput(concurrentInvoice);
    }

    return this.toOutput(invoice);
  }

  private toOutput(invoice: Invoice): CreateInvoiceOutput {
    return {
      invoiceId: invoice.id,
      orderId: invoice.orderId,
      paymentId: invoice.paymentId,
      status: invoice.status,
      total: invoice.total.toDTO(),
    };
  }
}
