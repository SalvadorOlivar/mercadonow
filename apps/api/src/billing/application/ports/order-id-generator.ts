import type { OrderId } from "@mercadonow/shared";

export interface OrderIdGenerator {
  generate(): OrderId;
}
