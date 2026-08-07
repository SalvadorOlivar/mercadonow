export const ORDER_ID_GENERATOR = Symbol("ORDER_ID_GENERATOR");
export const PAYMENT_ID_GENERATOR = Symbol("PAYMENT_ID_GENERATOR");
export const INVOICE_ID_GENERATOR = Symbol("INVOICE_ID_GENERATOR");

export interface IdGenerator<TId extends string> {
  generate(): TId;
}
