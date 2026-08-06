import { Injectable } from "@nestjs/common";
import type { OrderId } from "@mercadonow/shared";

import type { OrderRepositoryPort } from "../../../../../../application/ports/out/order-repository";
import type { Order } from "../../../../../../domain/order";
import { OrderItemEntity } from "../entity/order-item.entity";
import { OrderEntity } from "../entity/order.entity";
import { OrderMapper } from "../mapper/order.mapper";
import { EntityManagerContext } from "../entity-manager.context";

@Injectable()
export class OrderRepository implements OrderRepositoryPort {
  constructor(private readonly context: EntityManagerContext) {}

  async findById(id: OrderId): Promise<Order | null> {
    const entity = await this.context.current
      .getRepository(OrderEntity)
      .findOne({
        where: { id },
        relations: { items: true },
        order: { items: { position: "ASC" } },
      });
    return entity === null ? null : OrderMapper.toDomain(entity);
  }

  async save(order: Order): Promise<void> {
    const manager = this.context.current;
    const persistence = OrderMapper.toPersistence(order);
    await manager.getRepository(OrderEntity).upsert(persistence.order, [
      "id",
    ]);
    const items = manager.getRepository(OrderItemEntity);
    await items.delete({ orderId: order.id });
    await items.insert(persistence.items);
  }
}
