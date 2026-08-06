import { ORDER_STATUSES } from "@mercadonow/shared";

import { PersistenceMappingError } from "./persistence-mapping.error";
import {
  mapPersistedAggregate,
  toAllowedString,
  toCurrency,
  toSafeCents,
  toUuidV7Id,
} from "./persistence.mapper";

const uuidV7 = "0198f5ef-b5bd-7c86-a7b2-bc32c5c57888";

describe("TypeORM persistence mapping", () => {
  it("brands an ID only after validating UUID v7 at runtime", () => {
    expect(toUuidV7Id(uuidV7, "OrderId", "orders", "id")).toBe(uuidV7);
    expect(() =>
      toUuidV7Id(
        "550e8400-e29b-41d4-a716-446655440000",
        "OrderId",
        "orders",
        "id",
      ),
    ).toThrow(PersistenceMappingError);
  });

  it("validates statuses and currencies instead of trusting query types", () => {
    expect(
      toAllowedString("PAID", ORDER_STATUSES, "orders", "status"),
    ).toBe("PAID");
    expect(toCurrency("ARS", "orders", "currency")).toBe("ARS");
    expect(() =>
      toAllowedString("UNKNOWN", ORDER_STATUSES, "orders", "status"),
    ).toThrow(PersistenceMappingError);
    expect(() => toCurrency("BTC", "orders", "currency")).toThrow(
      PersistenceMappingError,
    );
  });

  it("maps PostgreSQL bigint strings only inside the safe integer range", () => {
    expect(
      toSafeCents(
        String(Number.MAX_SAFE_INTEGER),
        "payments",
        "amount",
      ),
    ).toBe(Number.MAX_SAFE_INTEGER);
    expect(() =>
      toSafeCents("9007199254740992", "payments", "amount"),
    ).toThrow(PersistenceMappingError);
    expect(() => toSafeCents("12.50", "payments", "amount")).toThrow(
      PersistenceMappingError,
    );
  });

  it("wraps domain rehydration failures with persistence context", () => {
    try {
      mapPersistedAggregate("payments", () => {
        throw new Error("invalid aggregate state");
      });
      throw new Error("Expected persistence mapping to fail");
    } catch (error) {
      expect(error).toMatchObject({
        code: "PERSISTENCE_MAPPING_ERROR",
        source: "payments",
        field: "aggregate",
      });
    }
  });
});
