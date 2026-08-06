import {
  Check,
  Column,
  CreateDateColumn,
  Entity,
  OneToMany,
  PrimaryColumn,
  UpdateDateColumn,
} from "typeorm";

import { OrderItemEntity } from "./order-item.entity";

@Entity({ name: "orders" })
@Check("orders_delivery_address_check", "length(trim(delivery_address)) > 0")
@Check(
  "orders_status_check",
  "status IN ('PENDING_PAYMENT', 'PAID', 'CANCELLED', 'COMPLETED')",
)
@Check("orders_total_amount_check", "total_amount >= 0")
@Check("orders_currency_check", "currency IN ('ARS', 'USD', 'EUR')")
export class OrderEntity {
  @PrimaryColumn({ type: "uuid" })
  declare id: string;

  @Column({ name: "customer_id", type: "uuid" })
  declare customerId: string;

  @Column({ name: "merchant_id", type: "uuid" })
  declare merchantId: string;

  @Column({ name: "delivery_address", type: "text" })
  declare deliveryAddress: string;

  @Column({ type: "text" })
  declare status: string;

  @Column({ name: "total_amount", type: "bigint" })
  declare totalAmount: string;

  @Column({ type: "text" })
  declare currency: string;

  @CreateDateColumn({ name: "created_at", type: "timestamptz" })
  declare createdAt: Date;

  @UpdateDateColumn({ name: "updated_at", type: "timestamptz" })
  declare updatedAt: Date;

  @OneToMany(() => OrderItemEntity, (item) => item.order)
  declare items: OrderItemEntity[];
}
