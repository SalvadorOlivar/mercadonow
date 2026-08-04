import type {
  OrderId,
  PaymentId,
  PaymentStatus,
} from "@mercadonow/shared";

import { InvalidStateTransitionError } from "../errors/invalid-state-transition.error";
import { Money } from "../value-objects/money";

export interface PaymentProps {
  readonly id: PaymentId;
  readonly orderId: OrderId;
  readonly amount: Money;
  readonly status?: PaymentStatus;
  readonly providerReference?: string;
}

export class Payment {
  readonly id: PaymentId;
  readonly orderId: OrderId;
  readonly amount: Money;
  private currentStatus: PaymentStatus;
  private currentProviderReference?: string;

  constructor(props: PaymentProps) {
    this.id = props.id;
    this.orderId = props.orderId;
    this.amount = props.amount;
    this.currentStatus = props.status ?? "PENDING";
    this.currentProviderReference = props.providerReference;
  }

  get status(): PaymentStatus {
    return this.currentStatus;
  }

  get providerReference(): string | undefined {
    return this.currentProviderReference;
  }

  authorize(providerReference: string): void {
    if (this.currentStatus !== "PENDING") {
      throw new InvalidStateTransitionError(
        "Payment",
        this.currentStatus,
        "AUTHORIZED",
      );
    }
    this.currentProviderReference = providerReference;
    this.currentStatus = "AUTHORIZED";
  }

  fail(): void {
    this.transition("PENDING", "FAILED");
  }

  refund(): void {
    this.transition("AUTHORIZED", "REFUNDED");
  }

  private transition(expected: PaymentStatus, next: PaymentStatus): void {
    if (this.currentStatus !== expected) {
      throw new InvalidStateTransitionError("Payment", this.currentStatus, next);
    }
    this.currentStatus = next;
  }
}

