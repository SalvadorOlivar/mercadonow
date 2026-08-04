import type { InvoiceId } from "@mercadonow/shared";

export interface InvoiceIdGenerator {
  generate(): InvoiceId;
}
