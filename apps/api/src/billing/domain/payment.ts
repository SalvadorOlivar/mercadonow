import type { OrderId, PaymentId, PaymentStatus } from "@mercadonow/shared";

import { DomainValidationError } from "./errors/domain-validation.error";
import { InvalidStateTransitionError } from "./errors/invalid-state-transition.error";
import type {
  NewPaymentProps,
  RehydratedPaymentProps,
} from "./interfaces/payment.interface";
import { Money } from "./value-objects/money";

export class Payment {
  readonly id: PaymentId;
  readonly orderId: OrderId;
  readonly amount: Money;
  private currentStatus: PaymentStatus;
  private currentProviderReference?: string;

  private constructor(
    props: NewPaymentProps,
    status: PaymentStatus,
    providerReference?: string,
  ) {
    this.id = props.id;
    this.orderId = props.orderId;
    this.amount = props.amount;
    this.currentStatus = status;
    this.currentProviderReference = this.validateProviderReference(
      status,
      providerReference,
    );
  }

  static create(props: NewPaymentProps): Payment {
    return new Payment(props, "PENDING");
  }

  static rehydrate(props: RehydratedPaymentProps): Payment {
    return new Payment(props, props.status, props.providerReference);
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
    this.currentProviderReference = this.requireProviderReference(
      providerReference,
    );
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

  private validateProviderReference(
    status: PaymentStatus,
    providerReference?: string,
  ): string | undefined {
    if (status === "AUTHORIZED" || status === "REFUNDED") {
      return this.requireProviderReference(providerReference);
    }
    if (providerReference !== undefined) {
      throw new DomainValidationError(
        `Payment ${status} cannot have a provider reference`,
      );
    }
    return undefined;
  }

  private requireProviderReference(providerReference?: string): string {
    if (
      providerReference === undefined ||
      providerReference.trim().length === 0
    ) {
      throw new DomainValidationError(
        "Authorized payment requires a provider reference",
      );
    }
    return providerReference.trim();
  }
}
