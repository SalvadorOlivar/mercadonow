import { asId } from "@mercadonow/shared";
import { version } from "uuid";

import { UuidV7IdGenerator } from "./uuid-v7-id-generator";

describe("UUID v7 outbound ID adapter", () => {
  it.each([
    ["order", new UuidV7IdGenerator((value) => asId(value, "OrderId"))],
    ["payment", new UuidV7IdGenerator((value) => asId(value, "PaymentId"))],
    ["invoice", new UuidV7IdGenerator((value) => asId(value, "InvoiceId"))],
  ])("generates UUID v7 %s IDs", (_name, generator) => {
    expect(version(generator.generate())).toBe(7);
  });
});
