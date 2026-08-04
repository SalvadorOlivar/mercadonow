import { Type } from "class-transformer";
import {
  ArrayMinSize,
  IsIn,
  IsInt,
  IsNotEmpty,
  IsString,
  IsUUID,
  Min,
  ValidateNested,
} from "class-validator";

import type { Currency } from "@mercadonow/shared";

class MoneyRequestDto {
  @IsInt()
  @Min(0)
  amount!: number;

  @IsIn(["ARS", "USD", "EUR"])
  currency!: Currency;
}

class OrderItemRequestDto {
  @IsString()
  @IsNotEmpty()
  productId!: string;

  @IsInt()
  @Min(1)
  quantity!: number;

  @ValidateNested()
  @Type(() => MoneyRequestDto)
  unitPrice!: MoneyRequestDto;
}

export class CreateOrderRequestDto {
  @IsUUID("7")
  customerId!: string;

  @IsUUID("7")
  merchantId!: string;

  @IsString()
  @IsNotEmpty()
  deliveryAddress!: string;

  @ArrayMinSize(1)
  @ValidateNested({ each: true })
  @Type(() => OrderItemRequestDto)
  items!: OrderItemRequestDto[];
}

export class CreateInvoiceRequestDto {
  @IsUUID("7")
  paymentId!: string;
}

export class OrderIdParamDto {
  @IsUUID("7")
  orderId!: string;
}

export class InvoiceIdParamDto {
  @IsUUID("7")
  invoiceId!: string;
}
