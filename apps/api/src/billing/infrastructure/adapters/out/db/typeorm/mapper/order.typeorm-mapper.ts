import { ORDER_STATUSES } from "@mercadonow/shared";

import { Order } from "../../../../../../domain/entities/order.entity";
import { Money } from "../../../../../../domain/value-objects/money";
import { OrderItemTypeOrmEntity } from "../entity/order-item.typeorm-entity";
import { OrderTypeOrmEntity } from "../entity/order.typeorm-entity";
import { PersistenceMappingError } from "./persistence-mapping.error";
import {
  mapPersistedAggregate,
  toAllowedString,
  toCurrency,
  toNonBlankText,
  toNonNegativeInteger,
  toPositiveInteger,
  toSafeCents,
  toUuidV7Id,
} from "./typeorm-persistence.mapper";

export class OrderTypeOrmMapper {
  static toDomain(entity: OrderTypeOrmEntity): Order {
    return mapPersistedAggregate("orders", () => {
      const items = [...(entity.items ?? [])].sort(
        (left, right) =>
          toNonNegativeInteger(left.position, "order_items", "position") -
          toNonNegativeInteger(right.position, "order_items", "position"),
      );
      if (items.length === 0) {
        throw new PersistenceMappingError(
          "order_items",
          "product_id",
          "order must contain at least one item",
        );
      }

      const order = Order.rehydrate({
        id: toUuidV7Id(entity.id, "OrderId", "orders", "id"),
        customerId: toUuidV7Id(
          entity.customerId,
          "CustomerId",
          "orders",
          "customer_id",
        ),
        merchantId: toUuidV7Id(
          entity.merchantId,
          "MerchantId",
          "orders",
          "merchant_id",
        ),
        deliveryAddress: toNonBlankText(
          entity.deliveryAddress,
          "orders",
          "delivery_address",
        ),
        status: toAllowedString(entity.status, ORDER_STATUSES, "orders", "status"),
        items: items.map((item) => ({
          productId: toNonBlankText(
            item.productId,
            "order_items",
            "product_id",
          ),
          quantity: toPositiveInteger(
            item.quantity,
            "order_items",
            "quantity",
          ),
          unitPrice: new Money(
            toSafeCents(
              item.unitPriceAmount,
              "order_items",
              "unit_price_amount",
            ),
            toCurrency(item.currency, "order_items", "currency"),
          ),
        })),
      });
      const storedTotal = new Money(
        toSafeCents(entity.totalAmount, "orders", "total_amount"),
        toCurrency(entity.currency, "orders", "currency"),
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

  static toPersistence(order: Order): {
    order: OrderTypeOrmEntity;
    items: OrderItemTypeOrmEntity[];
  } {
    const entity = Object.assign(new OrderTypeOrmEntity(), {
      id: order.id,
      customerId: order.customerId,
      merchantId: order.merchantId,
      deliveryAddress: order.deliveryAddress,
      status: order.status,
      totalAmount: String(order.total.amount),
      currency: order.total.currency,
    });
    const items = order.items.map((item, position) =>
      Object.assign(new OrderItemTypeOrmEntity(), {
        orderId: order.id,
        position,
        productId: item.productId,
        quantity: item.quantity,
        unitPriceAmount: String(item.unitPrice.amount),
        currency: item.unitPrice.currency,
      }),
    );
    return { order: entity, items };
  }
}
