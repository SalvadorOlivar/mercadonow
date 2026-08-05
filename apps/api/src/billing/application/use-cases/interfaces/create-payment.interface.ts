import type {
  CreatePaymentRequest,
  CreatePaymentResponse,
  OrderId,
} from "@mercadonow/shared";

export interface CreatePaymentInput extends CreatePaymentRequest {
  readonly orderId: OrderId;
}

export type CreatePaymentOutput = CreatePaymentResponse;
