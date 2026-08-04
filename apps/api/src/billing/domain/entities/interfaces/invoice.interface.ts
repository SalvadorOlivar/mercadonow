import type {
  InvoiceId,
  InvoiceStatus,
  OrderId,
  PaymentId,
} from "@mercadonow/shared";

import type { Money } from "../../value-objects/money";

export interface NewInvoiceProps {
  readonly id: InvoiceId;
  readonly orderId: OrderId;
  readonly paymentId: PaymentId;
  readonly total: Money;
}

export interface RehydratedInvoiceProps extends NewInvoiceProps {
  readonly status: InvoiceStatus;
}
