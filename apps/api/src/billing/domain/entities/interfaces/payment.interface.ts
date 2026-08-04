import type { OrderId, PaymentId, PaymentStatus } from "@mercadonow/shared";

import type { Money } from "../../value-objects/money";

export interface PaymentProps {
  readonly id: PaymentId;
  readonly orderId: OrderId;
  readonly amount: Money;
  readonly status?: PaymentStatus;
  readonly providerReference?: string;
}
