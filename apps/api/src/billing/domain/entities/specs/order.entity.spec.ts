import { asId } from "@mercadonow/shared";

import { DomainValidationError } from "../../errors/domain-validation.error";
import { InvalidStateTransitionError } from "../../errors/invalid-state-transition.error";
import { Money } from "../../value-objects/money";
import { Order } from "../order.entity";

const createOrder = (): Order =>
  new Order({
    id: asId("0198-order", "OrderId"),
    customerId: asId("0198-customer", "CustomerId"),
    merchantId: asId("0198-merchant", "MerchantId"),
    deliveryAddress: "Av. Siempre Viva 742",
    items: [
      { productId: "product-1", quantity: 2, unitPrice: new Money(1_500, "ARS") },
      { productId: "product-2", quantity: 1, unitPrice: new Money(500, "ARS") },
    ],
  });

describe("Order", () => {
  it("starts pending payment and calculates its total", () => {
    const order = createOrder();

    expect(order.status).toBe("PENDING_PAYMENT");
    expect(order.total.toDTO()).toEqual({ amount: 3_500, currency: "ARS" });
  });

  it("follows the paid to completed lifecycle", () => {
    const order = createOrder();

    order.markPaid();
    order.complete();

    expect(order.status).toBe("COMPLETED");
  });

  it("rejects an empty order", () => {
    expect(
      () =>
        new Order({
          id: asId("0198-order", "OrderId"),
          customerId: asId("0198-customer", "CustomerId"),
          merchantId: asId("0198-merchant", "MerchantId"),
          deliveryAddress: "Address",
          items: [],
        }),
    ).toThrow(DomainValidationError);
  });

  it("rejects invalid transitions", () => {
    expect(() => createOrder().complete()).toThrow(InvalidStateTransitionError);
  });
});
