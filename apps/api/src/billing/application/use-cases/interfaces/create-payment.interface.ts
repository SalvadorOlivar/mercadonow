import type {
  MoneyDTO,
  OrderId,
  PaymentId,
  PaymentStatus,
} from "@mercadonow/shared";

export interface CreatePaymentInput {
  readonly orderId: OrderId;
}

export interface CreatePaymentOutput {
  readonly paymentId: PaymentId;
  readonly orderId: OrderId;
  readonly status: PaymentStatus;
  readonly amount: MoneyDTO;
  readonly providerReference?: string;
}
