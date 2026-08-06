import { Order } from "../../domain/order";
import type { OrderRepositoryPort } from "../ports/out/order-repository";
import { Money } from "../../domain/value-objects/money";
import type { OrderIdGenerator } from "../ports/out/order-id-generator";
import type { TransactionManagerPort } from "../ports/out/transaction-manager";
import type {
  CreateOrderInput,
  CreateOrderOutput,
} from "./interfaces/create-order.interface";

export class CreateOrder {
  constructor(
    private readonly orderRepositoryPort: OrderRepositoryPort,
    private readonly transactionManagerPort: TransactionManagerPort,
    private readonly orderIdGenerator: OrderIdGenerator,
  ) {}

  execute(input: CreateOrderInput): Promise<CreateOrderOutput> {
    return this.transactionManagerPort.run(async () => {
      const order = Order.create({
        id: this.orderIdGenerator.generate(),
        customerId: input.customerId,
        merchantId: input.merchantId,
        deliveryAddress: input.deliveryAddress,
        items: input.items.map((item) => ({
          productId: item.productId,
          quantity: item.quantity,
          unitPrice: new Money(item.unitPrice.amount, item.unitPrice.currency),
        })),
      });

      await this.orderRepositoryPort.save(order);

      return {
        orderId: order.id,
        status: order.status,
        total: order.total.toDTO(),
      };
    });
  }
}
