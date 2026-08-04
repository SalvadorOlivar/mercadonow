import { Injectable } from "@nestjs/common";
import type {
  CustomerId,
  MerchantId,
  OrderId,
  OrderStatus,
} from "@mercadonow/shared";

import { DatabaseService } from "../../../database/database.service";
import { Order } from "../../domain/entities/order.entity";
import type { OrderRepository } from "../../domain/repositories/order.repository";
import { Money } from "../../domain/value-objects/money";

interface OrderRow {
  readonly id: string;
  readonly customer_id: string;
  readonly merchant_id: string;
  readonly delivery_address: string;
  readonly status: OrderStatus;
  readonly product_id: string;
  readonly quantity: number;
  readonly unit_price_amount: string;
  readonly item_currency: "ARS" | "USD" | "EUR";
}

@Injectable()
export class PostgresOrderRepository implements OrderRepository {
  constructor(private readonly database: DatabaseService) {}

  async findById(id: OrderId): Promise<Order | null> {
    const result = await this.database.query<OrderRow>(
      `SELECT o.id, o.customer_id, o.merchant_id, o.delivery_address, o.status,
              oi.product_id, oi.quantity, oi.unit_price_amount,
              oi.currency AS item_currency
         FROM orders o
         JOIN order_items oi ON oi.order_id = o.id
        WHERE o.id = $1
        ORDER BY oi.position`,
      [id],
    );
    const first = result.rows[0];
    if (first === undefined) return null;

    return new Order({
      id: first.id as OrderId,
      customerId: first.customer_id as CustomerId,
      merchantId: first.merchant_id as MerchantId,
      deliveryAddress: first.delivery_address,
      status: first.status,
      items: result.rows.map((row) => ({
        productId: row.product_id,
        quantity: row.quantity,
        unitPrice: new Money(Number(row.unit_price_amount), row.item_currency),
      })),
    });
  }

  async save(order: Order): Promise<void> {
    await this.database.query(
      `INSERT INTO orders
         (id, customer_id, merchant_id, delivery_address, status,
          total_amount, currency)
       VALUES ($1, $2, $3, $4, $5, $6, $7)
       ON CONFLICT (id) DO UPDATE SET
         customer_id = EXCLUDED.customer_id,
         merchant_id = EXCLUDED.merchant_id,
         delivery_address = EXCLUDED.delivery_address,
         status = EXCLUDED.status,
         total_amount = EXCLUDED.total_amount,
         currency = EXCLUDED.currency,
         updated_at = now()`,
      [
        order.id,
        order.customerId,
        order.merchantId,
        order.deliveryAddress,
        order.status,
        order.total.amount,
        order.total.currency,
      ],
    );
    await this.database.query("DELETE FROM order_items WHERE order_id = $1", [
      order.id,
    ]);

    for (const [position, item] of order.items.entries()) {
      await this.database.query(
        `INSERT INTO order_items
           (order_id, position, product_id, quantity, unit_price_amount, currency)
         VALUES ($1, $2, $3, $4, $5, $6)`,
        [
          order.id,
          position,
          item.productId,
          item.quantity,
          item.unitPrice.amount,
          item.unitPrice.currency,
        ],
      );
    }
  }
}

