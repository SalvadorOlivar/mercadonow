import type {
  CustomerId,
  MerchantId,
  MoneyDTO,
  OrderId,
  OrderStatus,
} from "@mercadonow/shared";

export interface CreateOrderItemInput {
  readonly productId: string;
  readonly quantity: number;
  readonly unitPrice: MoneyDTO;
}

export interface CreateOrderInput {
  readonly customerId: CustomerId;
  readonly merchantId: MerchantId;
  readonly deliveryAddress: string;
  readonly items: readonly CreateOrderItemInput[];
}

export interface CreateOrderOutput {
  readonly orderId: OrderId;
  readonly status: OrderStatus;
  readonly total: MoneyDTO;
}
