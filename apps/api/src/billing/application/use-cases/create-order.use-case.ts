import type {
  CustomerId,
  MerchantId,
  MoneyDTO,
  OrderId,
  OrderStatus,
} from "@mercadonow/shared";

import { Order } from "../../domain/entities/order.entity";
import type { OrderRepository } from "../../domain/repositories/order.repository";
import type { TransactionManager } from "../../domain/repositories/transaction-manager";
import { Money } from "../../domain/value-objects/money";
import type { OrderIdGenerator } from "../ports/order-id-generator";

export interface CreateOrderItemInput {
  readonly productId: string;
  readonly quantity: number;
  readonly unitPrice: MoneyDTO;
}

export interface CreateOrderInput {
  readonly customerId: CustomerId;
  readonly merchantId: MerchantId;
  readonly deliveryAddress: string;
  readonly items: readonly CreateOrderItemInput[];
}

export interface CreateOrderOutput {
  readonly orderId: OrderId;
  readonly status: OrderStatus;
  readonly total: MoneyDTO;
}

export class CreateOrder {
  constructor(
    private readonly orderRepository: OrderRepository,
    private readonly transactionManager: TransactionManager,
    private readonly orderIdGenerator: OrderIdGenerator,
  ) {}

  execute(input: CreateOrderInput): Promise<CreateOrderOutput> {
    return this.transactionManager.run(async () => {
      const order = new Order({
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
