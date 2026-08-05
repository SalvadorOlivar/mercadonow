import { BillingError } from "./billing.error";

export class InvalidStateTransitionError extends BillingError {
  readonly code = "INVALID_STATE_TRANSITION" as const;

  constructor(entity: string, from: string, to: string) {
    super(`${entity} cannot transition from ${from} to ${to}`);
    this.name = "InvalidStateTransitionError";
  }
}
