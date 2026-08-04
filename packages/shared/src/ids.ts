/**
 * IDs — branded UUID strings.
 *
 * Branding prevents accidentally passing an OrderId where a PaymentId is
 * expected, even though both are strings at runtime. We use UUID v7
 * (time-ordered, no cardinality leak) — see ADR-000.
 */

export type Brand<T, B extends string> = T & { readonly __brand: B };

export type CustomerId = Brand<string, "CustomerId">;
export type MerchantId = Brand<string, "MerchantId">;
export type OrderId = Brand<string, "OrderId">;
export type PaymentId = Brand<string, "PaymentId">;
export type InvoiceId = Brand<string, "InvoiceId">;

/** Cast a raw string into a branded ID. Use at boundaries (parsing input/DB rows). */
export function asId<B extends string>(
  raw: string,
  _brand: B,
): Brand<string, B> {
  return raw as Brand<string, B>;
}