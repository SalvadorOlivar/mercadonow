import type {
  CustomerId,
  MerchantId,
  OrderId,
  OrderStatus,
} from "@mercadonow/shared";

import { DomainValidationError } from "../errors/domain-validation.error";
import { InvalidStateTransitionError } from "../errors/invalid-state-transition.error";
import { Money } from "../value-objects/money";
import type { OrderItem, OrderProps } from "./interfaces/order.interface";

export class Order {
  readonly id: OrderId;
  readonly customerId: CustomerId;
  readonly merchantId: MerchantId;
  readonly items: readonly OrderItem[];
  readonly deliveryAddress: string;
  readonly total: Money;
  private currentStatus: OrderStatus;

  constructor(props: OrderProps) {
    if (props.items.length === 0) {
      throw new DomainValidationError("Order must contain at least one item");
    }
    if (props.deliveryAddress.trim().length === 0) {
      throw new DomainValidationError("Delivery address is required");
    }

    for (const item of props.items) {
      if (item.productId.trim().length === 0) {
        throw new DomainValidationError("Product ID is required");
      }
      if (!Number.isSafeInteger(item.quantity) || item.quantity <= 0) {
        throw new DomainValidationError("Item quantity must be a positive integer");
      }
    }

    this.id = props.id;
    this.customerId = props.customerId;
    this.merchantId = props.merchantId;
    this.items = props.items.map((item) => Object.freeze({ ...item }));
    this.deliveryAddress = props.deliveryAddress.trim();
    this.currentStatus = props.status ?? "PENDING_PAYMENT";
    this.total = this.calculateTotal();
  }

  get status(): OrderStatus {
    return this.currentStatus;
  }

  markPaid(): void {
    this.transition("PENDING_PAYMENT", "PAID");
  }

  complete(): void {
    this.transition("PAID", "COMPLETED");
  }

  cancel(): void {
    this.transition("PENDING_PAYMENT", "CANCELLED");
  }

  private calculateTotal(): Money {
    const firstItem = this.items[0];
    if (firstItem === undefined) {
      throw new DomainValidationError("Order must contain at least one item");
    }

    return this.items
      .slice(1)
      .reduce(
        (total, item) => total.add(item.unitPrice.multiply(item.quantity)),
        firstItem.unitPrice.multiply(firstItem.quantity),
      );
  }

  private transition(expected: OrderStatus, next: OrderStatus): void {
    if (this.currentStatus !== expected) {
      throw new InvalidStateTransitionError("Order", this.currentStatus, next);
    }
    this.currentStatus = next;
  }
}
