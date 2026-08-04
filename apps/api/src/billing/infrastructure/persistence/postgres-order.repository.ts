import { Injectable } from "@nestjs/common";
import type {
  OrderId,
} from "@mercadonow/shared";
import { ORDER_STATUSES } from "@mercadonow/shared";

import { DatabaseService } from "../../../database/database.service";
import { Order } from "../../domain/entities/order.entity";
import type { OrderRepository } from "../../domain/repositories/order.repository";
import { Money } from "../../domain/value-objects/money";
import { PersistenceMappingError } from "./persistence-mapping.error";
import {
  mapPersistedAggregate,
  toAllowedString,
  toCurrency,
  toNonBlankText,
  toPositiveInteger,
  toSafeCents,
  toUuidV7Id,
} from "./postgres-row.mapper";

interface OrderRow {
  readonly id: unknown;
  readonly customer_id: unknown;
  readonly merchant_id: unknown;
  readonly delivery_address: unknown;
  readonly status: unknown;
  readonly stored_total_amount: unknown;
  readonly order_currency: unknown;
  readonly product_id: unknown;
  readonly quantity: unknown;
  readonly unit_price_amount: unknown;
  readonly item_currency: unknown;
}

@Injectable()
export class PostgresOrderRepository implements OrderRepository {
  constructor(private readonly database: DatabaseService) {}

  async findById(id: OrderId): Promise<Order | null> {
    const result = await this.database.query<OrderRow>(
      `SELECT o.id, o.customer_id, o.merchant_id, o.delivery_address, o.status,
              o.total_amount AS stored_total_amount,
              o.currency AS order_currency,
              oi.product_id, oi.quantity, oi.unit_price_amount,
              oi.currency AS item_currency
         FROM orders o
         LEFT JOIN order_items oi ON oi.order_id = o.id
        WHERE o.id = $1
        ORDER BY oi.position`,
      [id],
    );
    const first = result.rows[0];
    if (first === undefined) return null;

    return mapPersistedAggregate("orders", () => {
      const order = Order.rehydrate({
        id: toUuidV7Id(first.id, "OrderId", "orders", "id"),
        customerId: toUuidV7Id(
          first.customer_id,
          "CustomerId",
          "orders",
          "customer_id",
        ),
        merchantId: toUuidV7Id(
          first.merchant_id,
          "MerchantId",
          "orders",
          "merchant_id",
        ),
        deliveryAddress: toNonBlankText(
          first.delivery_address,
          "orders",
          "delivery_address",
        ),
        status: toAllowedString(
          first.status,
          ORDER_STATUSES,
          "orders",
          "status",
        ),
        items: result.rows.map((row) => ({
          productId: toNonBlankText(
            row.product_id,
            "order_items",
            "product_id",
          ),
          quantity: toPositiveInteger(
            row.quantity,
            "order_items",
            "quantity",
          ),
          unitPrice: new Money(
            toSafeCents(
              row.unit_price_amount,
              "order_items",
              "unit_price_amount",
            ),
            toCurrency(row.item_currency, "order_items", "currency"),
          ),
        })),
      });
      const storedTotal = new Money(
        toSafeCents(
          first.stored_total_amount,
          "orders",
          "total_amount",
        ),
        toCurrency(first.order_currency, "orders", "currency"),
      );
      if (!order.total.equals(storedTotal)) {
        throw new PersistenceMappingError(
          "orders",
          "total_amount",
          "does not match the total calculated from order_items",
        );
      }
      return order;
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
