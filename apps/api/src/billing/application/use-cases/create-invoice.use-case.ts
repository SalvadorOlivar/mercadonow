import { Invoice } from "../../domain/entities/invoice.entity";
import type { InvoiceRepository } from "../../domain/repositories/invoice.repository";
import type { OrderRepository } from "../../domain/repositories/order.repository";
import type { PaymentRepository } from "../../domain/repositories/payment.repository";
import {
  InvoiceAlreadyExistsError,
  OrderNotFoundError,
  PaymentNotAuthorizedError,
  PaymentNotFoundError,
  PaymentOrderMismatchError,
} from "../errors/billing-application.errors";
import type { InvoiceIdGenerator } from "../ports/invoice-id-generator";
import type { TransactionManager } from "../ports/transaction-manager";
import type {
  CreateInvoiceInput,
  CreateInvoiceOutput,
} from "./interfaces/create-invoice.interface";

export class CreateInvoice {
  constructor(
    private readonly orderRepository: OrderRepository,
    private readonly paymentRepository: PaymentRepository,
    private readonly invoiceRepository: InvoiceRepository,
    private readonly transactionManager: TransactionManager,
    private readonly invoiceIdGenerator: InvoiceIdGenerator,
  ) {}

  async execute(input: CreateInvoiceInput): Promise<CreateInvoiceOutput> {
    const order = await this.orderRepository.findById(input.orderId);
    if (order === null) throw new OrderNotFoundError(input.orderId);

    const payment = await this.paymentRepository.findById(input.paymentId);
    if (payment === null) throw new PaymentNotFoundError(input.paymentId);
    if (payment.orderId !== order.id) {
      throw new PaymentOrderMismatchError(payment.id, order.id);
    }
    if (payment.status !== "AUTHORIZED") {
      throw new PaymentNotAuthorizedError(payment.id);
    }

    const existing = await this.invoiceRepository.findByPaymentId(payment.id);
    if (existing !== null) return this.toOutput(existing);

    const invoice = Invoice.create({
      id: this.invoiceIdGenerator.generate(),
      orderId: order.id,
      paymentId: payment.id,
      total: payment.amount,
    });
    invoice.issue();

    try {
      await this.transactionManager.run(() => this.invoiceRepository.save(invoice));
    } catch (error) {
      if (!(error instanceof InvoiceAlreadyExistsError)) throw error;

      // The failed INSERT transaction has rolled back before this read. The
      // unique payment_id constraint guarantees that the winning invoice is
      // now the stable idempotent result.
      const concurrentInvoice = await this.invoiceRepository.findByPaymentId(
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
