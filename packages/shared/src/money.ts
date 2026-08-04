/**
 * Money — wire contract.
 *
 * Internal representation everywhere (backend + frontend): integer cents.
 * A float-based representation is forbidden to avoid rounding errors
 * (see ADR-000). The rich `Money` value object with invariants lives in
 * apps/api/src/billing/domain; this package only defines the serializable
 * shape so FE and BE agree on the contract.
 */

export type Currency = "ARS" | "USD" | "EUR";

export interface MoneyDTO {
  /** Amount in the smallest currency unit (e.g. cents). Always an integer. */
  amount: number;
  currency: Currency;
}

export function isMoneyDTO(v: unknown): v is MoneyDTO {
  if (typeof v !== "object" || v === null) return false;
  const m = v as Record<string, unknown>;
  return (
    typeof m.amount === "number" &&
    Number.isInteger(m.amount) &&
    (m.currency === "ARS" || m.currency === "USD" || m.currency === "EUR")
  );
}