import type { OrderId } from "@mercadonow/shared";

import type { Order } from "../../../domain/order";

export const ORDER_REPOSITORY = Symbol("ORDER_REPOSITORY");

export interface OrderRepositoryPort {
  findById(id: OrderId): Promise<Order | null>;
  save(order: Order): Promise<void>;
}
