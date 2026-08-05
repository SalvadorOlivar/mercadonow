import { asId } from "@mercadonow/shared";
import { v7 } from "uuid";

import type { OrderIdGenerator } from "../../../../application/ports/order-id-generator";

export class UuidV7OrderIdGenerator implements OrderIdGenerator {
  generate() {
    return asId(v7(), "OrderId");
  }
}
