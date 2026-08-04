import type {
  InvoiceId,
  InvoiceStatus,
  OrderId,
  PaymentId,
} from "@mercadonow/shared";

import type { Money } from "../../value-objects/money";

export interface InvoiceProps {
  readonly id: InvoiceId;
  readonly orderId: OrderId;
  readonly paymentId: PaymentId;
  readonly total: Money;
  readonly status?: InvoiceStatus;
}
