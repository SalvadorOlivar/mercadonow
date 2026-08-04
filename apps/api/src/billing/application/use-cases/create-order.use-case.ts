import { Order } from "../../domain/entities/order.entity";
import type { OrderRepository } from "../../domain/repositories/order.repository";
import { Money } from "../../domain/value-objects/money";
import type { OrderIdGenerator } from "../ports/order-id-generator";
import type { TransactionManager } from "../ports/transaction-manager";
import type {
  CreateOrderInput,
  CreateOrderOutput,
} from "./interfaces/create-order.interface";

export class CreateOrder {
  constructor(
    private readonly orderRepository: OrderRepository,
    private readonly transactionManager: TransactionManager,
    private readonly orderIdGenerator: OrderIdGenerator,
  ) {}

  execute(input: CreateOrderInput): Promise<CreateOrderOutput> {
    return this.transactionManager.run(async () => {
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

      await this.orderRepository.save(order);

      return {
        orderId: order.id,
        status: order.status,
        total: order.total.toDTO(),
      };
    });
  }
}
