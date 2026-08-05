import { asId, BILLING_CONTRACT_LIMITS } from "@mercadonow/shared";

import { DomainValidationError } from "../../errors/domain-validation.error";
import { InvalidStateTransitionError } from "../../errors/invalid-state-transition.error";
import { Money } from "../../value-objects/money";
import { Order } from "../order.entity";

const createOrder = (): Order =>
  Order.create({
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

  it("rehydrates an existing lifecycle state without replaying transitions", () => {
    const order = Order.rehydrate({
      id: asId("0198-order", "OrderId"),
      customerId: asId("0198-customer", "CustomerId"),
      merchantId: asId("0198-merchant", "MerchantId"),
      deliveryAddress: "Address",
      items: [
        {
          productId: "product-1",
          quantity: 1,
          unitPrice: new Money(500, "ARS"),
        },
      ],
      status: "PAID",
    });

    expect(order.status).toBe("PAID");
  });

  it("owns an immutable copy of its item collection", () => {
    const order = createOrder();

    expect(Object.isFrozen(order.items)).toBe(true);
    expect(Object.isFrozen(order.items[0])).toBe(true);
  });

  it("rejects an empty order", () => {
    expect(
      () =>
        Order.create({
          id: asId("0198-order", "OrderId"),
          customerId: asId("0198-customer", "CustomerId"),
          merchantId: asId("0198-merchant", "MerchantId"),
          deliveryAddress: "Address",
          items: [],
        }),
    ).toThrow(DomainValidationError);
  });

  it.each([
    ["a whitespace-only delivery address", "   ", "product-1"],
    ["a whitespace-only product ID", "Address", "   "],
  ])("rejects %s", (_name, deliveryAddress, productId) => {
    expect(() =>
      Order.create({
        id: asId("0198-order", "OrderId"),
        customerId: asId("0198-customer", "CustomerId"),
        merchantId: asId("0198-merchant", "MerchantId"),
        deliveryAddress,
        items: [
          {
            productId,
            quantity: 1,
            unitPrice: new Money(100, "ARS"),
          },
        ],
      }),
    ).toThrow(DomainValidationError);
  });

  it.each([
    {
      name: "too many items",
      deliveryAddress: "Address",
      items: Array.from(
        { length: BILLING_CONTRACT_LIMITS.orderItemsMax + 1 },
        () => ({
          productId: "product-1",
          quantity: 1,
          unitPrice: new Money(100, "ARS"),
        }),
      ),
    },
    {
      name: "an overlong delivery address",
      deliveryAddress: "a".repeat(
        BILLING_CONTRACT_LIMITS.deliveryAddressMaxLength + 1,
      ),
      items: [
        {
          productId: "product-1",
          quantity: 1,
          unitPrice: new Money(100, "ARS"),
        },
      ],
    },
    {
      name: "an overlong product ID",
      deliveryAddress: "Address",
      items: [
        {
          productId: "p".repeat(
            BILLING_CONTRACT_LIMITS.productIdMaxLength + 1,
          ),
          quantity: 1,
          unitPrice: new Money(100, "ARS"),
        },
      ],
    },
    {
      name: "a quantity outside the persistence range",
      deliveryAddress: "Address",
      items: [
        {
          productId: "product-1",
          quantity: BILLING_CONTRACT_LIMITS.quantityMax + 1,
          unitPrice: new Money(100, "ARS"),
        },
      ],
    },
  ])("rejects $name without going through HTTP", ({ deliveryAddress, items }) => {
    expect(() =>
      Order.create({
        id: asId("0198-order", "OrderId"),
        customerId: asId("0198-customer", "CustomerId"),
        merchantId: asId("0198-merchant", "MerchantId"),
        deliveryAddress,
        items,
      }),
    ).toThrow(DomainValidationError);
  });

  it("rejects invalid transitions", () => {
    expect(() => createOrder().complete()).toThrow(InvalidStateTransitionError);
  });
});
