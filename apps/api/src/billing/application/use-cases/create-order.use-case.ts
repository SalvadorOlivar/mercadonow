import type { OrderId } from "@mercadonow/shared";

import { Order } from "../../domain/order";
import type { OrderPort } from "../ports/out/order.port";
import { Money } from "../../domain/value-objects/money";
import type { IdGenerator } from "../ports/out/id-generator.port";
import type { TransactionManagerPort } from "../ports/out/transaction-manager.port";
import type {
  CreateOrderInput,
  CreateOrderOutput,
} from "./interfaces/create-order.interface";

export class CreateOrder {
  constructor(
    private readonly OrderPort: OrderPort,
    private readonly transactionManagerPort: TransactionManagerPort,
    private readonly orderIdGenerator: IdGenerator<OrderId>,
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

      await this.OrderPort.save(order);

      return {
        orderId: order.id,
        status: order.status,
        total: order.total.toDTO(),
      };
    });
  }
}
