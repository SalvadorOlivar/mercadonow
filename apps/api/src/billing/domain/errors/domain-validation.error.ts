import { BillingError } from "./billing.error";

export class DomainValidationError extends BillingError {
  readonly code = "DOMAIN_VALIDATION_ERROR" as const;

  constructor(message: string) {
    super(message);
    this.name = "DomainValidationError";
  }
}
