import type { ExpectedBillingErrorCode } from "@mercadonow/shared";

/** Expected business failure that may safely cross the HTTP boundary. */
export abstract class BillingError extends Error {
  abstract readonly code: ExpectedBillingErrorCode;
}
