import type {
  CustomerId,
  MerchantId,
  OrderId,
  OrderStatus,
} from "@mercadonow/shared";
import { BILLING_CONTRACT_LIMITS } from "@mercadonow/shared";

import { DomainValidationError } from "../errors/domain-validation.error";
import { InvalidStateTransitionError } from "../errors/invalid-state-transition.error";
import { Money } from "../value-objects/money";
import type {
  NewOrderProps,
  OrderItem,
  RehydratedOrderProps,
} from "./interfaces/order.interface";

export class Order {
  readonly id: OrderId;
  readonly customerId: CustomerId;
  readonly merchantId: MerchantId;
  readonly items: readonly OrderItem[];
  readonly deliveryAddress: string;
  readonly total: Money;
  private currentStatus: OrderStatus;

  private constructor(props: NewOrderProps, status: OrderStatus) {
    if (props.items.length === 0) {
      throw new DomainValidationError("Order must contain at least one item");
    }
    if (props.items.length > BILLING_CONTRACT_LIMITS.orderItemsMax) {
      throw new DomainValidationError(
        `Order cannot contain more than ${BILLING_CONTRACT_LIMITS.orderItemsMax} items`,
      );
    }
    const deliveryAddress = props.deliveryAddress.trim();
    if (deliveryAddress.length === 0) {
      throw new DomainValidationError("Delivery address is required");
    }
    if (
      deliveryAddress.length >
      BILLING_CONTRACT_LIMITS.deliveryAddressMaxLength
    ) {
      throw new DomainValidationError(
        `Delivery address cannot exceed ${BILLING_CONTRACT_LIMITS.deliveryAddressMaxLength} characters`,
      );
    }

    for (const item of props.items) {
      const productId = item.productId.trim();
      if (productId.length === 0) {
        throw new DomainValidationError("Product ID is required");
      }
      if (productId.length > BILLING_CONTRACT_LIMITS.productIdMaxLength) {
        throw new DomainValidationError(
          `Product ID cannot exceed ${BILLING_CONTRACT_LIMITS.productIdMaxLength} characters`,
        );
      }
      if (
        !Number.isSafeInteger(item.quantity) ||
        item.quantity <= 0 ||
        item.quantity > BILLING_CONTRACT_LIMITS.quantityMax
      ) {
        throw new DomainValidationError("Item quantity must be a positive integer");
      }
    }

    this.id = props.id;
    this.customerId = props.customerId;
    this.merchantId = props.merchantId;
    this.items = Object.freeze(
      props.items.map((item) => Object.freeze({ ...item })),
    );
    this.deliveryAddress = deliveryAddress;
    this.currentStatus = status;
    this.total = this.calculateTotal();
  }

  static create(props: NewOrderProps): Order {
    return new Order(props, "PENDING_PAYMENT");
  }

  static rehydrate(props: RehydratedOrderProps): Order {
    return new Order(props, props.status);
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
