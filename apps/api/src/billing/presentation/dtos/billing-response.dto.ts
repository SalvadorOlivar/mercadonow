import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";
import {
  API_ERROR_CODES,
  BILLING_CONTRACT_LIMITS,
  CURRENCIES,
  INVOICE_STATUSES,
  ORDER_STATUSES,
  PAYMENT_STATUSES,
  UUID_V7_PATTERN,
  type ApiError,
  type ApiErrorCode,
  type ApiErrorResponse,
  type CreateInvoiceResponse,
  type CreateOrderResponse,
  type CreatePaymentResponse,
  type Currency,
  type GetInvoiceResponse,
  type InvoiceId,
  type InvoiceStatus,
  type MoneyDTO,
  type OrderId,
  type OrderStatus,
  type PaymentId,
  type PaymentStatus,
  type ValidationIssue,
} from "@mercadonow/shared";

export class MoneyResponseDto implements MoneyDTO {
  @ApiProperty({
    description: "Amount in the smallest currency unit (integer cents)",
    example: 3500,
    minimum: 0,
    maximum: BILLING_CONTRACT_LIMITS.moneyAmountMax,
  })
  amount!: number;

  @ApiProperty({ enum: CURRENCIES, example: "ARS" })
  currency!: Currency;
}

export class CreateOrderResponseDto implements CreateOrderResponse {
  @ApiProperty({
    example: "0198f5ef-b5bd-7c86-a7b2-bc32c5c57890",
    format: "uuid",
    pattern: UUID_V7_PATTERN,
  })
  orderId!: OrderId;

  @ApiProperty({ enum: ORDER_STATUSES, example: "PENDING_PAYMENT" })
  status!: OrderStatus;

  @ApiProperty({ type: () => MoneyResponseDto })
  total!: MoneyResponseDto;
}

export class CreatePaymentResponseDto implements CreatePaymentResponse {
  @ApiProperty({
    example: "0198f5ef-b5bd-7c86-a7b2-bc32c5c57891",
    format: "uuid",
    pattern: UUID_V7_PATTERN,
  })
  paymentId!: PaymentId;

  @ApiProperty({ format: "uuid", pattern: UUID_V7_PATTERN })
  orderId!: OrderId;

  @ApiProperty({ enum: PAYMENT_STATUSES, example: "AUTHORIZED" })
  status!: PaymentStatus;

  @ApiProperty({ type: () => MoneyResponseDto })
  amount!: MoneyResponseDto;

  @ApiPropertyOptional({ example: "sandbox-0198f5ef" })
  providerReference?: string;
}

export class CreateInvoiceResponseDto implements CreateInvoiceResponse {
  @ApiProperty({
    example: "0198f5ef-b5bd-7c86-a7b2-bc32c5c57892",
    format: "uuid",
    pattern: UUID_V7_PATTERN,
  })
  invoiceId!: InvoiceId;

  @ApiProperty({ format: "uuid", pattern: UUID_V7_PATTERN })
  orderId!: OrderId;

  @ApiProperty({ format: "uuid", pattern: UUID_V7_PATTERN })
  paymentId!: PaymentId;

  @ApiProperty({ enum: INVOICE_STATUSES, example: "ISSUED" })
  status!: InvoiceStatus;

  @ApiProperty({ type: () => MoneyResponseDto })
  total!: MoneyResponseDto;
}

export class GetInvoiceResponseDto
  extends CreateInvoiceResponseDto
  implements GetInvoiceResponse {}

export class ValidationIssueDto implements ValidationIssue {
  @ApiProperty({ example: "items.0.unitPrice.amount" })
  path!: string;

  @ApiProperty({
    type: [String],
    example: ["amount must not be less than 0"],
  })
  messages!: string[];
}

export class ApiErrorDto implements ApiError {
  @ApiProperty({ enum: API_ERROR_CODES, example: "VALIDATION_ERROR" })
  code!: ApiErrorCode;

  @ApiProperty({ example: "Request validation failed" })
  message!: string;

  @ApiPropertyOptional({ type: () => [ValidationIssueDto] })
  details?: ValidationIssueDto[];
}

export class ApiErrorResponseDto implements ApiErrorResponse {
  @ApiProperty({ example: 400 })
  statusCode!: number;

  @ApiProperty({ type: () => ApiErrorDto })
  error!: ApiErrorDto;
}
