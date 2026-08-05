import { Injectable } from "@nestjs/common";
import type { OrderId } from "@mercadonow/shared";

import type { Order } from "../../../../../../domain/entities/order.entity";
import type { OrderRepository } from "../../../../../../domain/repositories/order.repository";
import { OrderItemTypeOrmEntity } from "../entity/order-item.typeorm-entity";
import { OrderTypeOrmEntity } from "../entity/order.typeorm-entity";
import { OrderTypeOrmMapper } from "../mapper/order.typeorm-mapper";
import { TypeOrmEntityManagerContext } from "../typeorm-entity-manager.context";

@Injectable()
export class TypeOrmOrderRepository implements OrderRepository {
  constructor(private readonly context: TypeOrmEntityManagerContext) {}

  async findById(id: OrderId): Promise<Order | null> {
    const entity = await this.context.current
      .getRepository(OrderTypeOrmEntity)
      .findOne({
        where: { id },
        relations: { items: true },
        order: { items: { position: "ASC" } },
      });
    return entity === null ? null : OrderTypeOrmMapper.toDomain(entity);
  }

  async save(order: Order): Promise<void> {
    const manager = this.context.current;
    const persistence = OrderTypeOrmMapper.toPersistence(order);
    await manager.getRepository(OrderTypeOrmEntity).upsert(persistence.order, [
      "id",
    ]);
    const items = manager.getRepository(OrderItemTypeOrmEntity);
    await items.delete({ orderId: order.id });
    await items.insert(persistence.items);
  }
}
