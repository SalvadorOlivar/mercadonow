import type { MoneyDTO, OrderId, PaymentId } from "@mercadonow/shared";

export interface AuthorizePaymentInput {
  readonly paymentId: PaymentId;
  readonly orderId: OrderId;
  readonly amount: MoneyDTO;
}

export type AuthorizePaymentResult =
  | { readonly authorized: true; readonly providerReference: string }
  | { readonly authorized: false };

export interface PaymentGateway {
  authorize(input: AuthorizePaymentInput): Promise<AuthorizePaymentResult>;
}
