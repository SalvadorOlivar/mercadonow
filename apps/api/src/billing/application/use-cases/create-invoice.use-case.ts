import { Invoice } from "../../domain/invoice";
import type { InvoiceRepositoryPort } from "../ports/out/invoice-repository";
import type { OrderRepositoryPort } from "../ports/out/order-repository";
import type { PaymentRepositoryPort } from "../ports/out/payment-repository";
import {
  InvoiceAlreadyExistsError,
  OrderNotFoundError,
  PaymentNotAuthorizedError,
  PaymentNotFoundError,
  PaymentOrderMismatchError,
} from "../errors/billing-application.errors";
import type { InvoiceIdGenerator } from "../ports/out/invoice-id-generator";
import type { TransactionManagerPort } from "../ports/out/transaction-manager";
import type {
  CreateInvoiceInput,
  CreateInvoiceOutput,
} from "./interfaces/create-invoice.interface";

export class CreateInvoice {
  constructor(
    private readonly orderRepositoryPort: OrderRepositoryPort,
    private readonly paymentRepositoryPort: PaymentRepositoryPort,
    private readonly invoiceRepositoryPort: InvoiceRepositoryPort,
    private readonly transactionManagerPort: TransactionManagerPort,
    private readonly invoiceIdGenerator: InvoiceIdGenerator,
  ) {}

  async execute(input: CreateInvoiceInput): Promise<CreateInvoiceOutput> {
    const order = await this.orderRepositoryPort.findById(input.orderId);
    if (order === null) throw new OrderNotFoundError(input.orderId);

    const payment = await this.paymentRepositoryPort.findById(input.paymentId);
    if (payment === null) throw new PaymentNotFoundError(input.paymentId);
    if (payment.orderId !== order.id) {
      throw new PaymentOrderMismatchError(payment.id, order.id);
    }
    if (payment.status !== "AUTHORIZED") {
      throw new PaymentNotAuthorizedError(payment.id);
    }

    const existing = await this.invoiceRepositoryPort.findByPaymentId(payment.id);
    if (existing !== null) return this.toOutput(existing);

    const invoice = Invoice.create({
      id: this.invoiceIdGenerator.generate(),
      orderId: order.id,
      paymentId: payment.id,
      total: payment.amount,
    });
    invoice.issue();

    try {
      await this.transactionManagerPort.run(() => this.invoiceRepositoryPort.save(invoice));
    } catch (error) {
      if (!(error instanceof InvoiceAlreadyExistsError)) throw error;

      // The failed INSERT transaction has rolled back before this read. The
      // unique payment_id constraint guarantees that the winning invoice is
      // now the stable idempotent result.
      const concurrentInvoice = await this.invoiceRepositoryPort.findByPaymentId(
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
