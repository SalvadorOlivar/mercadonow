import { asId } from "@mercadonow/shared";
import { v7 } from "uuid";

import type { PaymentIdGenerator } from "../../application/ports/payment-id-generator";

export class UuidV7PaymentIdGenerator implements PaymentIdGenerator {
  generate() {
    return asId(v7(), "PaymentId");
  }
}
