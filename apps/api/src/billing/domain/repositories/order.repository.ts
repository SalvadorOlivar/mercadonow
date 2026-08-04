import type { OrderId } from "@mercadonow/shared";

import type { Order } from "../entities/order.entity";

export const ORDER_REPOSITORY = Symbol("ORDER_REPOSITORY");

export interface OrderRepository {
  findById(id: OrderId): Promise<Order | null>;
  save(order: Order): Promise<void>;
}
