import { version } from "uuid";

import { UuidV7InvoiceIdGenerator } from "./uuid-v7-invoice-id-generator";
import { UuidV7OrderIdGenerator } from "./uuid-v7-order-id-generator";
import { UuidV7PaymentIdGenerator } from "./uuid-v7-payment-id-generator";

describe("UUID v7 ID generators", () => {
  it.each([
    ["order", new UuidV7OrderIdGenerator()],
    ["payment", new UuidV7PaymentIdGenerator()],
    ["invoice", new UuidV7InvoiceIdGenerator()],
  ])("generates UUID v7 %s IDs", (_name, generator) => {
    const id = generator.generate();

    expect(version(id)).toBe(7);
  });
});
