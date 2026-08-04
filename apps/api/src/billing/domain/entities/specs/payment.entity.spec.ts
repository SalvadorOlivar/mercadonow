import { asId } from "@mercadonow/shared";

import { InvalidStateTransitionError } from "../../errors/invalid-state-transition.error";
import { Money } from "../../value-objects/money";
import { Payment } from "../payment.entity";

const createPayment = (): Payment =>
  new Payment({
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

  it("cannot refund a pending payment", () => {
    expect(() => createPayment().refund()).toThrow(InvalidStateTransitionError);
  });
});
