import type {
  BrandedCreateOrderRequest,
  CreateOrderItemRequest,
  CreateOrderResponse,
  CustomerId,
  MerchantId,
} from "@mercadonow/shared";

export type CreateOrderItemInput = CreateOrderItemRequest;

export interface CreateOrderInput extends BrandedCreateOrderRequest {
  readonly customerId: CustomerId;
  readonly merchantId: MerchantId;
}

export type CreateOrderOutput = CreateOrderResponse;
