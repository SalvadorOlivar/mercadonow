import {
  asId,
  type Brand,
  type Currency,
} from "@mercadonow/shared";
import { validate as isUuid, version as uuidVersion } from "uuid";

import { PersistenceMappingError } from "./persistence-mapping.error";

const CURRENCIES: readonly Currency[] = ["ARS", "USD", "EUR"];
const MAX_SAFE_INTEGER = BigInt(Number.MAX_SAFE_INTEGER);

export function toUuidV7Id<B extends string>(
  value: unknown,
  brand: B,
  source: string,
  field: string,
): Brand<string, B> {
  if (
    typeof value !== "string" ||
    !isUuid(value) ||
    uuidVersion(value) !== 7
  ) {
    throw invalid(source, field, "expected a UUID v7 string");
  }
  return asId(value, brand);
}

export function toCurrency(
  value: unknown,
  source: string,
  field: string,
): Currency {
  return toAllowedString(value, CURRENCIES, source, field);
}

export function toAllowedString<T extends string>(
  value: unknown,
  allowed: readonly T[],
  source: string,
  field: string,
): T {
  if (typeof value === "string") {
    const matched = allowed.find((candidate) => candidate === value);
    if (matched !== undefined) return matched;
  }
  throw invalid(source, field, `expected one of: ${allowed.join(", ")}`);
}

export function toSafeCents(
  value: unknown,
  source: string,
  field: string,
): number {
  if (typeof value !== "string" || !/^\d+$/.test(value)) {
    throw invalid(source, field, "expected a non-negative bigint string");
  }

  const amount = BigInt(value);
  if (amount > MAX_SAFE_INTEGER) {
    throw invalid(source, field, "exceeds Number.MAX_SAFE_INTEGER");
  }
  return Number(amount);
}

export function toPositiveInteger(
  value: unknown,
  source: string,
  field: string,
): number {
  if (
    typeof value !== "number" ||
    !Number.isSafeInteger(value) ||
    value <= 0
  ) {
    throw invalid(source, field, "expected a positive safe integer");
  }
  return value;
}

export function toNonBlankText(
  value: unknown,
  source: string,
  field: string,
): string {
  if (typeof value !== "string" || value.trim().length === 0) {
    throw invalid(source, field, "expected non-blank text");
  }
  return value;
}

export function toOptionalNonBlankText(
  value: unknown,
  source: string,
  field: string,
): string | undefined {
  if (value === null || value === undefined) return undefined;
  return toNonBlankText(value, source, field);
}

export function mapPersistedAggregate<T>(
  source: string,
  map: () => T,
): T {
  try {
    return map();
  } catch (error) {
    if (error instanceof PersistenceMappingError) throw error;
    const reason =
      error instanceof Error ? error.message : "domain rejected persisted state";
    throw new PersistenceMappingError(source, "aggregate", reason, {
      cause: error,
    });
  }
}

function invalid(
  source: string,
  field: string,
  reason: string,
): PersistenceMappingError {
  return new PersistenceMappingError(source, field, reason);
}
