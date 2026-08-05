import type { OrderId } from "@mercadonow/shared";

import { Payment } from "../../domain/entities/payment.entity";
import type { OrderRepository } from "../../domain/repositories/order.repository";
import type { PaymentRepository } from "../../domain/repositories/payment.repository";
import type { Money } from "../../domain/value-objects/money";
import {
  ActivePaymentAlreadyExistsError,
  OrderNotFoundError,
} from "../errors/billing-application.errors";
import type { PaymentGateway } from "../ports/payment-gateway";
import type { PaymentIdGenerator } from "../ports/payment-id-generator";
import type { TransactionManager } from "../ports/transaction-manager";
import type {
  CreatePaymentInput,
  CreatePaymentOutput,
} from "./interfaces/create-payment.interface";

export class CreatePayment {
  constructor(
    private readonly orderRepository: OrderRepository,
    private readonly paymentRepository: PaymentRepository,
    private readonly transactionManager: TransactionManager,
    private readonly paymentIdGenerator: PaymentIdGenerator,
    private readonly paymentGateway: PaymentGateway,
  ) {}

  async execute(input: CreatePaymentInput): Promise<CreatePaymentOutput> {
    const order = await this.orderRepository.findById(input.orderId);
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
      await this.transactionManager.run(() => this.paymentRepository.save(payment));
      return this.toOutput(payment);
    }

    payment.authorize(result.providerReference);
    order.markPaid();
    await this.transactionManager.run(async () => {
      await this.paymentRepository.save(payment);
      await this.orderRepository.save(order);
    });

    return this.toOutput(payment);
  }

  private async claimPayment(
    orderId: OrderId,
    amount: Money,
  ): Promise<Payment> {
    while (true) {
      const previousPayments = await this.paymentRepository.findByOrderId(orderId);
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
        await this.transactionManager.run(() =>
          this.paymentRepository.save(payment),
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
