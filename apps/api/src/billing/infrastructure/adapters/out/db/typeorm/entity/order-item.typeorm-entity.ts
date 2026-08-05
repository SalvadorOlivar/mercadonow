import {
  Check,
  Column,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryColumn,
} from "typeorm";

import { OrderTypeOrmEntity } from "./order.typeorm-entity";

@Entity({ name: "order_items" })
@Check("order_items_position_check", "position >= 0")
@Check("order_items_product_id_check", "length(trim(product_id)) > 0")
@Check("order_items_quantity_check", "quantity > 0")
@Check("order_items_unit_price_amount_check", "unit_price_amount >= 0")
@Check("order_items_currency_check", "currency IN ('ARS', 'USD', 'EUR')")
export class OrderItemTypeOrmEntity {
  @PrimaryColumn({ name: "order_id", type: "uuid" })
  declare orderId: string;

  @PrimaryColumn({ type: "integer" })
  declare position: number;

  @Column({ name: "product_id", type: "text" })
  declare productId: string;

  @Column({ type: "integer" })
  declare quantity: number;

  @Column({ name: "unit_price_amount", type: "bigint" })
  declare unitPriceAmount: string;

  @Column({ type: "text" })
  declare currency: string;

  @ManyToOne(() => OrderTypeOrmEntity, (order) => order.items, {
    onDelete: "CASCADE",
  })
  @JoinColumn({ name: "order_id" })
  declare order: OrderTypeOrmEntity;
}
