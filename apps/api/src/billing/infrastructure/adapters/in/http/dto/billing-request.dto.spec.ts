import type { ArgumentMetadata } from "@nestjs/common";
import { plainToInstance } from "class-transformer";
import { validate, type ValidationError } from "class-validator";
import { BILLING_CONTRACT_LIMITS } from "@mercadonow/shared";

import { createRequestValidationPipe } from "../../../../../../common/http/request-validation.pipe";
import { RequestValidationException } from "../../../../../../common/http/request-validation.exception";
import {
  CreateInvoiceRequestDto,
  CreateOrderRequestDto,
  InvoiceIdParamDto,
  MoneyRequestDto,
  OrderIdParamDto,
  OrderItemRequestDto,
} from "./billing-request.dto";

const validUuid = "0198f5ef-b5bd-7c86-a7b2-bc32c5c57888";

describe("Billing request DTO validation", () => {
  it("rejects unsafe money amounts and unsupported currencies", async () => {
    const errors = await validateDto(MoneyRequestDto, {
      amount: Number.MAX_SAFE_INTEGER + 1,
      currency: "BTC",
    });

    expect(properties(errors)).toEqual(expect.arrayContaining(["amount", "currency"]));
  });

  it("rejects whitespace product IDs and out-of-range quantities", async () => {
    const errors = await validateDto(OrderItemRequestDto, {
      productId: "   ",
      quantity: BILLING_CONTRACT_LIMITS.quantityMax + 1,
      unitPrice: { amount: 100, currency: "ARS" },
    });

    expect(properties(errors)).toEqual(expect.arrayContaining(["productId", "quantity"]));
  });

  it("rejects invalid IDs, whitespace addresses, empty arrays, and excessive lengths", async () => {
    const errors = await validateDto(CreateOrderRequestDto, {
      customerId: "not-a-uuid",
      merchantId: validUuid,
      deliveryAddress: " ".repeat(BILLING_CONTRACT_LIMITS.deliveryAddressMaxLength + 1),
      items: [],
    });

    expect(properties(errors)).toEqual(
      expect.arrayContaining(["customerId", "deliveryAddress", "items"]),
    );
  });

  it("rejects arrays above the public item limit", async () => {
    const item = {
      productId: "product-1",
      quantity: 1,
      unitPrice: { amount: 100, currency: "ARS" },
    };
    const errors = await validateDto(CreateOrderRequestDto, {
      customerId: validUuid,
      merchantId: validUuid,
      deliveryAddress: "Valid address",
      items: Array.from(
        { length: BILLING_CONTRACT_LIMITS.orderItemsMax + 1 },
        () => item,
      ),
    });

    expect(properties(errors)).toContain("items");
  });

  const uuidBoundaryCases: ReadonlyArray<
    readonly [DtoClass<object>, object, string]
  > = [
    [CreateInvoiceRequestDto, { paymentId: "invalid" }, "paymentId"],
    [OrderIdParamDto, { orderId: "invalid" }, "orderId"],
    [InvoiceIdParamDto, { invoiceId: "invalid" }, "invoiceId"],
  ];

  it.each(uuidBoundaryCases)("validates every UUID boundary DTO", async (Dto, value, property) => {
    const errors = await validateDto(Dto, value);

    expect(properties(errors)).toContain(property);
  });

  it("rejects product identifiers above the public length limit", async () => {
    const errors = await validateDto(OrderItemRequestDto, {
      productId: "p".repeat(BILLING_CONTRACT_LIMITS.productIdMaxLength + 1),
      quantity: 1,
      unitPrice: { amount: 100, currency: "ARS" },
    });

    expect(properties(errors)).toContain("productId");
  });

  it("normalizes nested validation paths and hides rejected values", async () => {
    const pipe = createRequestValidationPipe();
    const metadata: ArgumentMetadata = {
      type: "body",
      metatype: CreateOrderRequestDto,
    };
    const value = {
      customerId: validUuid,
      merchantId: validUuid,
      deliveryAddress: "Valid address",
      items: [
        {
          productId: "product-1",
          quantity: 1,
          unitPrice: { amount: -1, currency: "ARS" },
        },
      ],
      unexpected: "must not leak",
    };

    await expect(pipe.transform(value, metadata)).rejects.toMatchObject({
      issues: expect.arrayContaining([
        expect.objectContaining({ path: "items.0.unitPrice.amount" }),
        expect.objectContaining({ path: "unexpected" }),
      ]),
    } satisfies Partial<RequestValidationException>);
  });
});

type DtoClass<T extends object> = new () => T;

async function validateDto<T extends object>(
  Dto: DtoClass<T>,
  value: object,
): Promise<ValidationError[]> {
  return validate(plainToInstance(Dto, value));
}

function properties(errors: readonly ValidationError[]): string[] {
  return errors.map((error) => error.property);
}
