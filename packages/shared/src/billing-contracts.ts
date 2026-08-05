import type {
  CustomerId,
  InvoiceId,
  MerchantId,
  OrderId,
  PaymentId,
} from "./ids";
import type { MoneyDTO } from "./money";
import type { InvoiceStatus, OrderStatus, PaymentStatus } from "./status";

export const UUID_V7_PATTERN =
  "^[0-9a-f]{8}-[0-9a-f]{4}-7[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$";

export const BILLING_CONTRACT_LIMITS = {
  deliveryAddressMaxLength: 500,
  orderItemsMax: 100,
  productIdMaxLength: 100,
  quantityMax: 2_147_483_647,
  moneyAmountMax: Number.MAX_SAFE_INTEGER,
} as const;

export interface CreateOrderItemRequest {
  readonly productId: string;
  readonly quantity: number;
  readonly unitPrice: MoneyDTO;
}

export interface CreateOrderRequest {
  readonly customerId: string;
  readonly merchantId: string;
  readonly deliveryAddress: string;
  readonly items: readonly CreateOrderItemRequest[];
}

export interface CreateOrderResponse {
  readonly orderId: OrderId;
  readonly status: OrderStatus;
  readonly total: MoneyDTO;
}

export interface CreatePaymentRequest {
  readonly orderId: string;
}

export interface CreatePaymentResponse {
  readonly paymentId: PaymentId;
  readonly orderId: OrderId;
  readonly status: PaymentStatus;
  readonly amount: MoneyDTO;
  readonly providerReference?: string;
}

export interface CreateInvoiceRequest {
  readonly orderId: string;
  readonly paymentId: string;
}

export interface CreateInvoiceResponse {
  readonly invoiceId: InvoiceId;
  readonly orderId: OrderId;
  readonly paymentId: PaymentId;
  readonly status: InvoiceStatus;
  readonly total: MoneyDTO;
}

export interface GetInvoiceRequest {
  readonly invoiceId: string;
}

export type GetInvoiceResponse = CreateInvoiceResponse;

export type BrandedCreateOrderRequest = Omit<
  CreateOrderRequest,
  "customerId" | "merchantId"
> & {
  readonly customerId: CustomerId;
  readonly merchantId: MerchantId;
};

export const EXPECTED_BILLING_ERROR_CODES = [
  "DOMAIN_VALIDATION_ERROR",
  "INVALID_STATE_TRANSITION",
  "ORDER_NOT_FOUND",
  "PAYMENT_NOT_FOUND",
  "INVOICE_NOT_FOUND",
  "PAYMENT_NOT_AUTHORIZED",
  "PAYMENT_ORDER_MISMATCH",
  "INVOICE_ALREADY_EXISTS",
] as const;

export type ExpectedBillingErrorCode =
  (typeof EXPECTED_BILLING_ERROR_CODES)[number];

export const API_ERROR_CODES = [
  ...EXPECTED_BILLING_ERROR_CODES,
  "VALIDATION_ERROR",
  "HTTP_ERROR",
  "INTERNAL_ERROR",
] as const;

export type ApiErrorCode = (typeof API_ERROR_CODES)[number];

export interface ValidationIssue {
  readonly path: string;
  readonly messages: readonly string[];
}

export interface ApiError {
  readonly code: ApiErrorCode;
  readonly message: string;
  readonly details?: readonly ValidationIssue[];
}

export interface ApiErrorResponse {
  readonly statusCode: number;
  readonly error: ApiError;
}
