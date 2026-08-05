import { Type } from "class-transformer";
import { ApiProperty } from "@nestjs/swagger";
import {
  ArrayMaxSize,
  ArrayMinSize,
  IsArray,
  IsDefined,
  IsIn,
  IsInt,
  IsString,
  IsUUID,
  Matches,
  Max,
  MaxLength,
  Min,
  ValidateNested,
} from "class-validator";

import {
  BILLING_CONTRACT_LIMITS,
  CURRENCIES,
  UUID_V7_PATTERN,
  type CreateInvoiceRequest,
  type CreateOrderItemRequest,
  type CreateOrderRequest,
  type CreatePaymentRequest,
  type Currency,
  type GetInvoiceRequest,
  type MoneyDTO,
} from "@mercadonow/shared";

export class MoneyRequestDto implements MoneyDTO {
  @ApiProperty({
    description: "Amount in the smallest currency unit (integer cents)",
    example: 1500,
    minimum: 0,
    maximum: BILLING_CONTRACT_LIMITS.moneyAmountMax,
  })
  @IsInt()
  @Min(0)
  @Max(BILLING_CONTRACT_LIMITS.moneyAmountMax)
  amount!: number;

  @ApiProperty({ enum: CURRENCIES, example: "ARS" })
  @IsIn(CURRENCIES)
  currency!: Currency;
}

export class OrderItemRequestDto implements CreateOrderItemRequest {
  @ApiProperty({
    example: "product-1",
    maxLength: BILLING_CONTRACT_LIMITS.productIdMaxLength,
    pattern: "\\S",
  })
  @IsString()
  @Matches(/\S/, { message: "productId must contain non-whitespace characters" })
  @MaxLength(BILLING_CONTRACT_LIMITS.productIdMaxLength)
  productId!: string;

  @ApiProperty({
    example: 2,
    minimum: 1,
    maximum: BILLING_CONTRACT_LIMITS.quantityMax,
  })
  @IsInt()
  @Min(1)
  @Max(BILLING_CONTRACT_LIMITS.quantityMax)
  quantity!: number;

  @ApiProperty({ type: () => MoneyRequestDto })
  @IsDefined()
  @ValidateNested()
  @Type(() => MoneyRequestDto)
  unitPrice!: MoneyRequestDto;
}

export class CreateOrderRequestDto implements CreateOrderRequest {
  @ApiProperty({
    description: "UUID v7 customer identifier",
    example: "0198f5ef-b5bd-7c86-a7b2-bc32c5c57888",
    format: "uuid",
    pattern: UUID_V7_PATTERN,
  })
  @IsUUID("7")
  customerId!: string;

  @ApiProperty({
    description: "UUID v7 merchant identifier",
    example: "0198f5ef-b5bd-7c86-a7b2-bc32c5c57889",
    format: "uuid",
    pattern: UUID_V7_PATTERN,
  })
  @IsUUID("7")
  merchantId!: string;

  @ApiProperty({
    example: "Av. Siempre Viva 742",
    maxLength: BILLING_CONTRACT_LIMITS.deliveryAddressMaxLength,
    pattern: "\\S",
  })
  @IsString()
  @Matches(/\S/, {
    message: "deliveryAddress must contain non-whitespace characters",
  })
  @MaxLength(BILLING_CONTRACT_LIMITS.deliveryAddressMaxLength)
  deliveryAddress!: string;

  @ApiProperty({
    type: () => [OrderItemRequestDto],
    minItems: 1,
    maxItems: BILLING_CONTRACT_LIMITS.orderItemsMax,
  })
  @IsArray()
  @ArrayMinSize(1)
  @ArrayMaxSize(BILLING_CONTRACT_LIMITS.orderItemsMax)
  @ValidateNested({ each: true })
  @Type(() => OrderItemRequestDto)
  items!: OrderItemRequestDto[];
}

export class CreateInvoiceRequestDto
  implements Pick<CreateInvoiceRequest, "paymentId">
{
  @ApiProperty({
    description: "UUID v7 payment identifier",
    example: "0198f5ef-b5bd-7c86-a7b2-bc32c5c57891",
    format: "uuid",
    pattern: UUID_V7_PATTERN,
  })
  @IsUUID("7")
  paymentId!: string;
}

export class OrderIdParamDto
  implements Pick<CreatePaymentRequest, "orderId">
{
  @ApiProperty({ format: "uuid", pattern: UUID_V7_PATTERN })
  @IsUUID("7")
  orderId!: string;
}

export class InvoiceIdParamDto implements GetInvoiceRequest {
  @ApiProperty({ format: "uuid", pattern: UUID_V7_PATTERN })
  @IsUUID("7")
  invoiceId!: string;
}
