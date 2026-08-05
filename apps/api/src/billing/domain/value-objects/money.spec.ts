import { DomainValidationError } from "../errors/domain-validation.error";
import { Money } from "./money";

describe("Money", () => {
  it("adds amounts in the same currency", () => {
    expect(new Money(100, "USD").add(new Money(250, "USD")).amount).toBe(350);
  });

  it("rejects decimals and negative amounts", () => {
    expect(() => new Money(1.5, "USD")).toThrow(DomainValidationError);
    expect(() => new Money(-1, "USD")).toThrow(DomainValidationError);
    expect(() => new Money(Number.MAX_SAFE_INTEGER + 1, "USD")).toThrow(
      DomainValidationError,
    );
  });

  it("rejects operations between currencies", () => {
    expect(() => new Money(100, "USD").add(new Money(100, "EUR"))).toThrow(
      DomainValidationError,
    );
  });

  it("is immutable at runtime", () => {
    expect(Object.isFrozen(new Money(100, "USD"))).toBe(true);
  });
});
