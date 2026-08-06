import { asId } from "@mercadonow/shared";

import { Order } from "../../../domain/order";
import { Payment } from "../../../domain/payment";
import type { OrderRepositoryPort } from "../../ports/out/order-repository";
import type { PaymentRepositoryPort } from "../../ports/out/payment-repository";
import { Money } from "../../../domain/value-objects/money";
import {
  ActivePaymentAlreadyExistsError,
  OrderNotFoundError,
} from "../../errors/billing-application.errors";
import type { PaymentGateway } from "../../ports/out/payment-gateway";
import type { PaymentIdGenerator } from "../../ports/out/payment-id-generator";
import type { TransactionManagerPort } from "../../ports/out/transaction-manager";
import { CreatePayment } from "../create-payment.use-case";

const orderId = asId("0198f5ef-b5bd-7c86-a7b2-bc32c5c57888", "OrderId");
const paymentId = asId("0198f5ef-b5bd-7c86-a7b2-bc32c5c57889", "PaymentId");
const failedPaymentId = asId(
  "0198f5ef-b5bd-7c86-a7b2-bc32c5c57894",
  "PaymentId",
);

const makeOrder = () =>
  Order.create({
    id: orderId,
    customerId: asId("0198f5ef-b5bd-7c86-a7b2-bc32c5c57890", "CustomerId"),
    merchantId: asId("0198f5ef-b5bd-7c86-a7b2-bc32c5c57891", "MerchantId"),
    deliveryAddress: "Address",
    items: [
      { productId: "product-1", quantity: 2, unitPrice: new Money(750, "ARS") },
    ],
  });

const makePayment = (
  status: "PENDING" | "AUTHORIZED" | "FAILED" = "PENDING",
  id = paymentId,
) => {
  const payment = Payment.create({
    id,
    orderId,
    amount: new Money(1_500, "ARS"),
  });
  if (status === "AUTHORIZED") payment.authorize("provider-existing");
  if (status === "FAILED") payment.fail();
  return payment;
};

const setup = (options?: {
  order?: Order | null;
  payments?: readonly Payment[];
  authorized?: boolean;
}) => {
  const order = options?.order === undefined ? makeOrder() : options.order;
  const orderRepository: jest.Mocked<OrderRepositoryPort> = {
    findById: jest.fn().mockResolvedValue(order),
    save: jest.fn().mockResolvedValue(undefined),
  };
  const paymentRepository: jest.Mocked<PaymentRepositoryPort> = {
    findById: jest.fn().mockResolvedValue(null),
    findByOrderId: jest.fn().mockResolvedValue(options?.payments ?? []),
    save: jest.fn().mockResolvedValue(undefined),
  };
  const transactionManager: TransactionManagerPort = {
    run: jest.fn(async <T>(work: () => Promise<T>) => work()),
  };
  const idGenerator: PaymentIdGenerator = { generate: () => paymentId };
  const gateway: jest.Mocked<PaymentGateway> = {
    authorize: jest.fn().mockResolvedValue(
      options?.authorized === false
        ? { authorized: false }
        : { authorized: true, providerReference: "provider-new" },
    ),
  };
  const useCase = new CreatePayment(
    orderRepository,
    paymentRepository,
    transactionManager,
    idGenerator,
    gateway,
  );

  return { gateway, order, orderRepository, paymentRepository, transactionManager, useCase };
};

describe("CreatePayment", () => {
  it("authorizes the order total and atomically persists payment and paid order", async () => {
    const { gateway, order, orderRepository, paymentRepository, transactionManager, useCase } = setup();

    const output = await useCase.execute({ orderId });

    expect(gateway.authorize).toHaveBeenCalledWith({
      paymentId,
      orderId,
      amount: { amount: 1_500, currency: "ARS" },
    });
    expect(output).toEqual({
      paymentId,
      orderId,
      status: "AUTHORIZED",
      amount: { amount: 1_500, currency: "ARS" },
      providerReference: "provider-new",
    });
    expect(order?.status).toBe("PAID");
    expect(paymentRepository.save).toHaveBeenCalledTimes(2);
    expect(orderRepository.save).toHaveBeenCalledTimes(1);
    expect(transactionManager.run).toHaveBeenCalledTimes(2);
  });

  it("persists a rejected attempt as failed without marking the order paid", async () => {
    const { order, orderRepository, paymentRepository, useCase } = setup({ authorized: false });

    const output = await useCase.execute({ orderId });

    expect(output.status).toBe("FAILED");
    expect(order?.status).toBe("PENDING_PAYMENT");
    expect(paymentRepository.save).toHaveBeenCalledTimes(2);
    expect(orderRepository.save).not.toHaveBeenCalled();
  });

  it("reuses a pending attempt when retrying", async () => {
    const pending = makePayment();
    const { gateway, paymentRepository, useCase } = setup({ payments: [pending] });

    await useCase.execute({ orderId });

    expect(gateway.authorize).toHaveBeenCalledWith(expect.objectContaining({ paymentId }));
    expect(paymentRepository.save).toHaveBeenCalledTimes(1);
  });

  it("returns an authorized payment idempotently without charging again", async () => {
    const authorized = makePayment("AUTHORIZED");
    const { gateway, paymentRepository, useCase } = setup({ payments: [authorized] });

    const output = await useCase.execute({ orderId });

    expect(output.status).toBe("AUTHORIZED");
    expect(gateway.authorize).not.toHaveBeenCalled();
    expect(paymentRepository.save).not.toHaveBeenCalled();
  });

  it("creates a fresh logical attempt after a failed payment", async () => {
    const failed = makePayment("FAILED", failedPaymentId);
    const { gateway, paymentRepository, useCase } = setup({ payments: [failed] });

    await useCase.execute({ orderId });

    expect(gateway.authorize).toHaveBeenCalledWith(
      expect.objectContaining({ paymentId }),
    );
    expect(gateway.authorize).not.toHaveBeenCalledWith(
      expect.objectContaining({ paymentId: failedPaymentId }),
    );
    expect(paymentRepository.save).toHaveBeenCalledTimes(2);
  });

  it("recovers a concurrent claim and uses the winner's stable gateway identity", async () => {
    const pending = makePayment();
    const { gateway, paymentRepository, useCase } = setup();
    paymentRepository.findByOrderId
      .mockResolvedValueOnce([])
      .mockResolvedValueOnce([pending]);
    paymentRepository.save.mockRejectedValueOnce(
      new ActivePaymentAlreadyExistsError(orderId),
    );

    const output = await useCase.execute({ orderId });

    expect(output.paymentId).toBe(paymentId);
    expect(gateway.authorize).toHaveBeenCalledWith(
      expect.objectContaining({ paymentId }),
    );
  });

  it("throws a typed error when the order does not exist", async () => {
    const { gateway, paymentRepository, useCase } = setup({ order: null });

    await expect(useCase.execute({ orderId })).rejects.toThrow(OrderNotFoundError);
    expect(gateway.authorize).not.toHaveBeenCalled();
    expect(paymentRepository.save).not.toHaveBeenCalled();
  });
});
