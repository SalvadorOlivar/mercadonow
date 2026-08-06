import type { OrderId } from "@mercadonow/shared";

import { Payment } from "../../domain/payment";
import type { OrderRepositoryPort } from "../ports/out/order-repository";
import type { PaymentRepositoryPort } from "../ports/out/payment-repository";
import type { Money } from "../../domain/value-objects/money";
import {
  ActivePaymentAlreadyExistsError,
  OrderNotFoundError,
} from "../errors/billing-application.errors";
import type { PaymentGateway } from "../ports/out/payment-gateway";
import type { PaymentIdGenerator } from "../ports/out/payment-id-generator";
import type { TransactionManagerPort } from "../ports/out/transaction-manager";
import type {
  CreatePaymentInput,
  CreatePaymentOutput,
} from "./interfaces/create-payment.interface";

export class CreatePayment {
  constructor(
    private readonly OrderRepositoryPort: OrderRepositoryPort,
    private readonly paymentRepositoryPort: PaymentRepositoryPort,
    private readonly transactionManagerPort: TransactionManagerPort,
    private readonly paymentIdGenerator: PaymentIdGenerator,
    private readonly paymentGateway: PaymentGateway,
  ) {}

  async execute(input: CreatePaymentInput): Promise<CreatePaymentOutput> {
    const order = await this.OrderRepositoryPort.findById(input.orderId);
    if (order === null) throw new OrderNotFoundError(input.orderId);

    const payment = await this.claimPayment(order.id, order.total);
    if (payment.status === "AUTHORIZED") return this.toOutput(payment);

    const result = await this.paymentGateway.authorize({
      paymentId: payment.id,
      orderId: payment.orderId,
      amount: payment.amount.toDTO(),
    });

    if (!result.authorized) {
      payment.fail();
      await this.transactionManagerPort.run(() => this.paymentRepositoryPort.save(payment));
      return this.toOutput(payment);
    }

    payment.authorize(result.providerReference);
    order.markPaid();
    await this.transactionManagerPort.run(async () => {
      await this.paymentRepositoryPort.save(payment);
      await this.OrderRepositoryPort.save(order);
    });

    return this.toOutput(payment);
  }

  private async claimPayment(
    orderId: OrderId,
    amount: Money,
  ): Promise<Payment> {
    while (true) {
      const previousPayments = await this.paymentRepositoryPort.findByOrderId(orderId);
      const authorized = previousPayments.find(
        (payment) => payment.status === "AUTHORIZED",
      );
      if (authorized !== undefined) return authorized;

      const pending = previousPayments.find(
        (payment) => payment.status === "PENDING",
      );
      if (pending !== undefined) return pending;

      const payment = Payment.create({
        id: this.paymentIdGenerator.generate(),
        orderId,
        amount,
      });

      try {
        await this.transactionManagerPort.run(() =>
          this.paymentRepositoryPort.save(payment),
        );
        return payment;
      } catch (error) {
        if (!(error instanceof ActivePaymentAlreadyExistsError)) throw error;
        // Another request claimed the order. Re-read its stable attempt. If it
        // already failed, the retry policy deliberately permits a fresh claim.
      }
    }
  }

  private toOutput(payment: Payment): CreatePaymentOutput {
    return {
      paymentId: payment.id,
      orderId: payment.orderId,
      status: payment.status,
      amount: payment.amount.toDTO(),
      ...(payment.providerReference === undefined
        ? {}
        : { providerReference: payment.providerReference }),
    };
  }
}
