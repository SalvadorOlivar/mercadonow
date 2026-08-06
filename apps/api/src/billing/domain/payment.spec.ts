import { asId } from "@mercadonow/shared";

import { DomainValidationError } from "./errors/domain-validation.error";
import { InvalidStateTransitionError } from "./errors/invalid-state-transition.error";
import { Money } from "./value-objects/money";
import { Payment } from "./payment";

const createPayment = (): Payment =>
  Payment.create({
    id: asId("0198-payment", "PaymentId"),
    orderId: asId("0198-order", "OrderId"),
    amount: new Money(3_500, "ARS"),
  });

describe("Payment", () => {
  it("stores only the order ID and starts pending", () => {
    const payment = createPayment();

    expect(payment.orderId).toBe("0198-order");
    expect(payment.status).toBe("PENDING");
  });

  it("can be authorized and refunded", () => {
    const payment = createPayment();

    payment.authorize("provider-123");
    payment.refund();

    expect(payment.status).toBe("REFUNDED");
    expect(payment.providerReference).toBe("provider-123");
  });

  it("rehydrates authorized and refunded payments with their provider reference", () => {
    const payment = Payment.rehydrate({
      id: asId("0198-payment", "PaymentId"),
      orderId: asId("0198-order", "OrderId"),
      amount: new Money(3_500, "ARS"),
      status: "REFUNDED",
      providerReference: "provider-existing",
    });

    expect(payment.status).toBe("REFUNDED");
    expect(payment.providerReference).toBe("provider-existing");
  });

  it("rejects rehydrating an authorized payment without a provider reference", () => {
    expect(() =>
      Payment.rehydrate({
        id: asId("0198-payment", "PaymentId"),
        orderId: asId("0198-order", "OrderId"),
        amount: new Money(3_500, "ARS"),
        status: "AUTHORIZED",
      }),
    ).toThrow(DomainValidationError);
  });

  it("rejects provider data on states that do not own it", () => {
    expect(() =>
      Payment.rehydrate({
        id: asId("0198-payment", "PaymentId"),
        orderId: asId("0198-order", "OrderId"),
        amount: new Money(3_500, "ARS"),
        status: "PENDING",
        providerReference: "provider-unexpected",
      }),
    ).toThrow(DomainValidationError);
  });

  it("rejects blank provider references when authorizing", () => {
    const payment = createPayment();

    expect(() => payment.authorize("   ")).toThrow(DomainValidationError);
    expect(payment.status).toBe("PENDING");
  });

  it("cannot refund a pending payment", () => {
    expect(() => createPayment().refund()).toThrow(InvalidStateTransitionError);
  });
});
