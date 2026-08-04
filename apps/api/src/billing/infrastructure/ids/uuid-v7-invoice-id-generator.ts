import { asId } from "@mercadonow/shared";
import { v7 } from "uuid";

import type { InvoiceIdGenerator } from "../../application/ports/invoice-id-generator";

export class UuidV7InvoiceIdGenerator implements InvoiceIdGenerator {
  generate() {
    return asId(v7(), "InvoiceId");
  }
}
