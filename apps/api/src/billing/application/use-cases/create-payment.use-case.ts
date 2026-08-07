import type { OrderId, PaymentId } from "@mercadonow/shared";

import { Payment } from "../../domain/payment";
import type { OrderPort } from "../ports/out/order.port";
import type { PaymentPort } from "../ports/out/payment.port";
import type { Money } from "../../domain/value-objects/money";
import {
  ActivePaymentAlreadyExistsError,
  OrderNotFoundError,
} from "../errors/billing-application.errors";
import type { PaymentGateway } from "./interfaces/payment-gateway";
import type { IdGenerator } from "../ports/out/id-generator.port";
import type { TransactionManagerPort } from "../ports/out/transaction-manager.port";
import type {
  CreatePaymentInput,
  CreatePaymentOutput,
} from "./interfaces/create-payment.interface";

export class CreatePayment {
  constructor(
    private readonly OrderPort: OrderPort,
    private readonly PaymentPort: PaymentPort,
    private readonly transactionManagerPort: TransactionManagerPort,
    private readonly paymentIdGenerator: IdGenerator<PaymentId>,
    private readonly paymentGateway: PaymentGateway,
  ) {}

  async execute(input: CreatePaymentInput): Promise<CreatePaymentOutput> {
    const order = await this.OrderPort.findById(input.orderId);
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
      await this.transactionManagerPort.run(() => this.PaymentPort.save(payment));
      return this.toOutput(payment);
    }

    payment.authorize(result.providerReference);
    order.markPaid();
    await this.transactionManagerPort.run(async () => {
      await this.PaymentPort.save(payment);
      await this.OrderPort.save(order);
    });

    return this.toOutput(payment);
  }

  private async claimPayment(
    orderId: OrderId,
    amount: Money,
  ): Promise<Payment> {
    while (true) {
      const previousPayments = await this.PaymentPort.findByOrderId(orderId);
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
          this.PaymentPort.save(payment),
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
