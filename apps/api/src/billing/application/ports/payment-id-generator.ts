import type { PaymentId } from "@mercadonow/shared";

export interface PaymentIdGenerator {
  generate(): PaymentId;
}
