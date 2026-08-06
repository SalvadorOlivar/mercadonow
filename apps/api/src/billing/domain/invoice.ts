import type { InvoiceId, InvoiceStatus, OrderId, PaymentId } from "@mercadonow/shared";

import { InvalidStateTransitionError } from "./errors/invalid-state-transition.error";
import type {
  NewInvoiceProps,
  RehydratedInvoiceProps,
} from "./interfaces/invoice.interface";
import { Money } from "./value-objects/money";

export class Invoice {
  readonly id: InvoiceId;
  readonly orderId: OrderId;
  readonly paymentId: PaymentId;
  readonly total: Money;
  private currentStatus: InvoiceStatus;

  private constructor(props: NewInvoiceProps, status: InvoiceStatus) {
    this.id = props.id;
    this.orderId = props.orderId;
    this.paymentId = props.paymentId;
    this.total = props.total;
    this.currentStatus = status;
  }

  static create(props: NewInvoiceProps): Invoice {
    return new Invoice(props, "DRAFT");
  }

  static rehydrate(props: RehydratedInvoiceProps): Invoice {
    return new Invoice(props, props.status);
  }

  get status(): InvoiceStatus {
    return this.currentStatus;
  }

  issue(): void {
    this.transition("DRAFT", "ISSUED");
  }

  markPaid(): void {
    this.transition("ISSUED", "PAID");
  }

  cancel(): void {
    if (this.currentStatus !== "DRAFT" && this.currentStatus !== "ISSUED") {
      throw new InvalidStateTransitionError(
        "Invoice",
        this.currentStatus,
        "CANCELLED",
      );
    }
    this.currentStatus = "CANCELLED";
  }

  private transition(expected: InvoiceStatus, next: InvoiceStatus): void {
    if (this.currentStatus !== expected) {
      throw new InvalidStateTransitionError("Invoice", this.currentStatus, next);
    }
    this.currentStatus = next;
  }
}
