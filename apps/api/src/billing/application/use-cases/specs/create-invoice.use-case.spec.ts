import { asId } from "@mercadonow/shared";

import { Invoice } from "../../../domain/invoice";
import { Order } from "../../../domain/order";
import { Payment } from "../../../domain/payment";
import type { InvoiceRepository } from "../../ports/out/invoice-repository";
import type { OrderRepository } from "../../ports/out/order-repository";
import type { PaymentRepository } from "../../ports/out/payment-repository";
import { Money } from "../../../domain/value-objects/money";
import {
  InvoiceAlreadyExistsError,
  OrderNotFoundError,
  PaymentNotAuthorizedError,
  PaymentNotFoundError,
  PaymentOrderMismatchError,
} from "../../errors/billing-application.errors";
import type { InvoiceIdGenerator } from "../../ports/out/invoice-id-generator";
import type { TransactionManager } from "../../ports/out/transaction-manager";
import { CreateInvoice } from "../create-invoice.use-case";

const orderId = asId("0198f5ef-b5bd-7c86-a7b2-bc32c5c57888", "OrderId");
const otherOrderId = asId("0198f5ef-b5bd-7c86-a7b2-bc32c5c57889", "OrderId");
const paymentId = asId("0198f5ef-b5bd-7c86-a7b2-bc32c5c57890", "PaymentId");
const invoiceId = asId("0198f5ef-b5bd-7c86-a7b2-bc32c5c57891", "InvoiceId");

const makeOrder = () =>
  Order.create({
    id: orderId,
    customerId: asId("0198f5ef-b5bd-7c86-a7b2-bc32c5c57892", "CustomerId"),
    merchantId: asId("0198f5ef-b5bd-7c86-a7b2-bc32c5c57893", "MerchantId"),
    deliveryAddress: "Address",
    items: [{ productId: "product-1", quantity: 1, unitPrice: new Money(900, "ARS") }],
  });

const makePayment = (authorized = true, associatedOrderId = orderId) => {
  const payment = Payment.create({
    id: paymentId,
    orderId: associatedOrderId,
    amount: new Money(900, "ARS"),
  });
  if (authorized) payment.authorize("provider-1");
  return payment;
};

const makeInvoice = () =>
  Invoice.create({
    id: invoiceId,
    orderId,
    paymentId,
    total: new Money(900, "ARS"),
  });

const setup = (options?: {
  order?: Order | null;
  payment?: Payment | null;
  existingInvoice?: Invoice | null;
}) => {
  const orderRepository: jest.Mocked<OrderRepository> = {
    findById: jest.fn().mockResolvedValue(options?.order === undefined ? makeOrder() : options.order),
    save: jest.fn().mockResolvedValue(undefined),
  };
  const paymentRepository: jest.Mocked<PaymentRepository> = {
    findById: jest.fn().mockResolvedValue(
      options?.payment === undefined ? makePayment() : options.payment,
    ),
    findByOrderId: jest.fn().mockResolvedValue([]),
    save: jest.fn().mockResolvedValue(undefined),
  };
  const invoiceRepository: jest.Mocked<InvoiceRepository> = {
    findById: jest.fn().mockResolvedValue(null),
    findByOrderId: jest.fn().mockResolvedValue(null),
    findByPaymentId: jest.fn().mockResolvedValue(options?.existingInvoice ?? null),
    save: jest.fn().mockResolvedValue(undefined),
  };
  const transactionManager: TransactionManager = {
    run: jest.fn(async <T>(work: () => Promise<T>) => work()),
  };
  const idGenerator: InvoiceIdGenerator = { generate: () => invoiceId };
  const useCase = new CreateInvoice(
    orderRepository,
    paymentRepository,
    invoiceRepository,
    transactionManager,
    idGenerator,
  );

  return { invoiceRepository, transactionManager, useCase };
};

describe("CreateInvoice", () => {
  it("issues and persists an invoice for an authorized payment", async () => {
    const { invoiceRepository, transactionManager, useCase } = setup();

    const output = await useCase.execute({ orderId, paymentId });

    expect(output).toEqual({
      invoiceId,
      orderId,
      paymentId,
      status: "ISSUED",
      total: { amount: 900, currency: "ARS" },
    });
    expect(invoiceRepository.save).toHaveBeenCalledTimes(1);
    expect(transactionManager.run).toHaveBeenCalledTimes(1);
  });

  it.each([
    ["missing order", { order: null }, OrderNotFoundError],
    ["missing payment", { payment: null }, PaymentNotFoundError],
    [
      "payment from another order",
      { payment: makePayment(true, otherOrderId) },
      PaymentOrderMismatchError,
    ],
    ["pending payment", { payment: makePayment(false) }, PaymentNotAuthorizedError],
  ])("rejects %s without persisting", async (_name, options, expectedError) => {
    const { invoiceRepository, useCase } = setup(options);

    await expect(useCase.execute({ orderId, paymentId })).rejects.toThrow(expectedError);
    expect(invoiceRepository.save).not.toHaveBeenCalled();
  });

  it("returns an existing invoice idempotently without persisting", async () => {
    const existingInvoice = makeInvoice();
    existingInvoice.issue();
    const { invoiceRepository, useCase } = setup({ existingInvoice });

    const output = await useCase.execute({ orderId, paymentId });

    expect(output).toMatchObject({ invoiceId, paymentId, status: "ISSUED" });
    expect(invoiceRepository.save).not.toHaveBeenCalled();
  });

  it("returns the winning invoice when the unique constraint settles a race", async () => {
    const winningInvoice = makeInvoice();
    winningInvoice.issue();
    const { invoiceRepository, useCase } = setup();
    invoiceRepository.findByPaymentId
      .mockResolvedValueOnce(null)
      .mockResolvedValueOnce(winningInvoice);
    invoiceRepository.save.mockRejectedValueOnce(
      new InvoiceAlreadyExistsError(paymentId),
    );

    const output = await useCase.execute({ orderId, paymentId });

    expect(output).toMatchObject({ invoiceId, paymentId, status: "ISSUED" });
    expect(invoiceRepository.findByPaymentId).toHaveBeenCalledTimes(2);
  });
});
