import type { Currency, MoneyDTO } from "@mercadonow/shared";

import { DomainValidationError } from "../errors/domain-validation.error";

export class Money {
  readonly amount: number;
  readonly currency: Currency;

  constructor(amount: number, currency: Currency) {
    if (!Number.isSafeInteger(amount) || amount < 0) {
      throw new DomainValidationError(
        "Money amount must be a non-negative safe integer",
      );
    }

    this.amount = amount;
    this.currency = currency;
    Object.freeze(this);
  }

  add(other: Money): Money {
    this.assertSameCurrency(other);
    return new Money(this.amount + other.amount, this.currency);
  }

  multiply(quantity: number): Money {
    if (!Number.isSafeInteger(quantity) || quantity <= 0) {
      throw new DomainValidationError("Quantity must be a positive safe integer");
    }

    return new Money(this.amount * quantity, this.currency);
  }

  equals(other: Money): boolean {
    return this.amount === other.amount && this.currency === other.currency;
  }

  toDTO(): MoneyDTO {
    return { amount: this.amount, currency: this.currency };
  }

  private assertSameCurrency(other: Money): void {
    if (this.currency !== other.currency) {
      throw new DomainValidationError("Cannot operate on different currencies");
    }
  }
}
