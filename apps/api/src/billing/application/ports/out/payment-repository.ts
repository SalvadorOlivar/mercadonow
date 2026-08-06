import type { OrderId, PaymentId } from "@mercadonow/shared";

import type { Payment } from "../../../domain/payment";

export const PAYMENT_REPOSITORY = Symbol("PAYMENT_REPOSITORY");

export interface PaymentPort {
  findById(id: PaymentId): Promise<Payment | null>;
  findByOrderId(orderId: OrderId): Promise<readonly Payment[]>;
  save(payment: Payment): Promise<void>;
}
