import { version } from "uuid";

import { UuidV7OrderIdGenerator } from "./uuid-v7-order-id-generator";

describe("UuidV7OrderIdGenerator", () => {
  it("generates UUID v7 order IDs", () => {
    const generator = new UuidV7OrderIdGenerator();

    expect(version(generator.generate())).toBe(7);
  });
});
