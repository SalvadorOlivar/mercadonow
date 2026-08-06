import type { OrderId, PaymentId, PaymentStatus } from "@mercadonow/shared";

import type { Money } from "../value-objects/money";

export interface NewPaymentProps {
  readonly id: PaymentId;
  readonly orderId: OrderId;
  readonly amount: Money;
}

export interface RehydratedPaymentProps extends NewPaymentProps {
  readonly status: PaymentStatus;
  readonly providerReference?: string;
}
