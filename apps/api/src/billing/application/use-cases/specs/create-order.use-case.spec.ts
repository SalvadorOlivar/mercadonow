import { asId } from "@mercadonow/shared";

import { DomainValidationError } from "../../../domain/errors/domain-validation.error";
import type { Order } from "../../../domain/order";
import type { OrderRepositoryPort } from "../../ports/out/order-repository";
import type { TransactionManagerPort } from "../../ports/out/transaction-manager";
import type { OrderIdGenerator } from "../../ports/out/order-id-generator";
import { CreateOrder } from "../create-order.use-case";
import type { CreateOrderInput } from "../interfaces/create-order.interface";

class TestTransactionManager implements TransactionManagerPort {
  runs = 0;
  active = false;

  async run<T>(work: () => Promise<T>): Promise<T> {
    this.runs += 1;
    this.active = true;
    try {
      return await work();
    } finally {
      this.active = false;
    }
  }
}

class InMemoryOrderRepository implements OrderRepositoryPort {
  readonly saved: Order[] = [];
  savedInsideTransaction = false;

  constructor(private readonly transactionManager: TestTransactionManager) {}

  async findById(): Promise<Order | null> {
    return null;
  }

  async save(order: Order): Promise<void> {
    this.savedInsideTransaction = this.transactionManager.active;
    this.saved.push(order);
  }
}

class FixedOrderIdGenerator implements OrderIdGenerator {
  readonly id = asId("0198f5ef-b5bd-7c86-a7b2-bc32c5c57888", "OrderId");

  generate() {
    return this.id;
  }
}

const validInput = (): CreateOrderInput => ({
  customerId: asId("0198f5ef-b5bd-7c86-a7b2-bc32c5c57889", "CustomerId"),
  merchantId: asId("0198f5ef-b5bd-7c86-a7b2-bc32c5c57890", "MerchantId"),
  deliveryAddress: "Av. Siempre Viva 742",
  items: [
    {
      productId: "product-1",
      quantity: 2,
      unitPrice: { amount: 1_500, currency: "ARS" },
    },
    {
      productId: "product-2",
      quantity: 1,
      unitPrice: { amount: 500, currency: "ARS" },
    },
  ],
});

const setup = () => {
  const transactionManager = new TestTransactionManager();
  const repository = new InMemoryOrderRepository(transactionManager);
  const idGenerator = new FixedOrderIdGenerator();
  const useCase = new CreateOrder(repository, transactionManager, idGenerator);

  return { idGenerator, repository, transactionManager, useCase };
};

describe("CreateOrder", () => {
  it("creates and persists an order, returning its application output", async () => {
    const { idGenerator, repository, useCase } = setup();

    const output = await useCase.execute(validInput());

    expect(output).toEqual({
      orderId: idGenerator.id,
      status: "PENDING_PAYMENT",
      total: { amount: 3_500, currency: "ARS" },
    });
    expect(repository.saved).toHaveLength(1);
  });

  it("preserves the input data in the persisted domain entity", async () => {
    const { repository, useCase } = setup();
    const input = validInput();

    await useCase.execute(input);

    const saved = repository.saved[0];
    expect(saved).toBeDefined();
    expect(saved).toMatchObject({
      customerId: input.customerId,
      merchantId: input.merchantId,
      deliveryAddress: input.deliveryAddress,
      status: "PENDING_PAYMENT",
    });
    expect(saved?.items).toHaveLength(2);
    expect(saved?.items[0]).toMatchObject({
      productId: "product-1",
      quantity: 2,
    });
    expect(saved?.items[0]?.unitPrice.toDTO()).toEqual({
      amount: 1_500,
      currency: "ARS",
    });
  });

  it("persists the order inside the application transaction", async () => {
    const { repository, transactionManager, useCase } = setup();

    await useCase.execute(validInput());

    expect(transactionManager.runs).toBe(1);
    expect(repository.savedInsideTransaction).toBe(true);
  });

  it.each([
    ["empty items", (input: CreateOrderInput) => ({ ...input, items: [] })],
    [
      "invalid quantity",
      (input: CreateOrderInput) => ({
        ...input,
        items: [{ ...input.items[0]!, quantity: 0 }],
      }),
    ],
    [
      "empty delivery address",
      (input: CreateOrderInput) => ({ ...input, deliveryAddress: "   " }),
    ],
    [
      "empty product ID",
      (input: CreateOrderInput) => ({
        ...input,
        items: [{ ...input.items[0]!, productId: "   " }],
      }),
    ],
    [
      "mixed currencies",
      (input: CreateOrderInput) => ({
        ...input,
        items: [
          input.items[0]!,
          {
            ...input.items[1]!,
            unitPrice: { amount: 500, currency: "USD" as const },
          },
        ],
      }),
    ],
  ])("rejects %s without persisting", async (_name, makeInvalid) => {
    const { repository, useCase } = setup();

    await expect(useCase.execute(makeInvalid(validInput()))).rejects.toThrow(
      DomainValidationError,
    );
    expect(repository.saved).toHaveLength(0);
  });
});
