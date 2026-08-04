import type {
  CustomerId,
  MerchantId,
  OrderId,
  OrderStatus,
} from "@mercadonow/shared";

import type { Money } from "../../value-objects/money";

export interface OrderItem {
  readonly productId: string;
  readonly quantity: number;
  readonly unitPrice: Money;
}

export interface NewOrderProps {
  readonly id: OrderId;
  readonly customerId: CustomerId;
  readonly merchantId: MerchantId;
  readonly items: readonly OrderItem[];
  readonly deliveryAddress: string;
}

export interface RehydratedOrderProps extends NewOrderProps {
  readonly status: OrderStatus;
}
