import type {
  ApiErrorResponse,
  CreateInvoiceRequest,
  CreateInvoiceResponse,
  CreateOrderRequest,
  CreateOrderResponse,
  CreatePaymentRequest,
  CreatePaymentResponse,
  GetInvoiceRequest,
  GetInvoiceResponse,
} from "@mercadonow/shared";

/**
 * Compile-time boundary check: the web workspace must be able to consume every
 * public Billing request, response and error contract without framework types.
 */
export type BillingPublicContractCompilationCheck = readonly [
  CreateOrderRequest,
  CreateOrderResponse,
  CreatePaymentRequest,
  CreatePaymentResponse,
  CreateInvoiceRequest,
  CreateInvoiceResponse,
  GetInvoiceRequest,
  GetInvoiceResponse,
  ApiErrorResponse,
];
