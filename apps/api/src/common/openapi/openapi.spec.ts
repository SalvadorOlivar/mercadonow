import { Test } from "@nestjs/testing";
import type { INestApplication } from "@nestjs/common";

import { CreateInvoice } from "../../billing/application/use-cases/create-invoice.use-case";
import { CreateOrder } from "../../billing/application/use-cases/create-order.use-case";
import { CreatePayment } from "../../billing/application/use-cases/create-payment.use-case";
import { GetInvoice } from "../../billing/application/use-cases/get-invoice.use-case";
import { BillingController } from "../../billing/presentation/billing.controller";
import { createOpenApiDocument } from "./openapi";

describe("Billing OpenAPI", () => {
  let app: INestApplication;

  beforeAll(async () => {
    const useCase = { execute: jest.fn() };
    const moduleRef = await Test.createTestingModule({
      controllers: [BillingController],
      providers: [
        { provide: CreateOrder, useValue: useCase },
        { provide: CreatePayment, useValue: useCase },
        { provide: CreateInvoice, useValue: useCase },
        { provide: GetInvoice, useValue: useCase },
      ],
    }).compile();
    app = moduleRef.createNestApplication();
  });

  afterAll(async () => app.close());

  it("contains the four public Billing operations and their HTTP outcomes", () => {
    const document = createOpenApiDocument(app);

    expect(Object.keys(document.paths).sort()).toEqual([
      "/invoices/{invoiceId}",
      "/orders",
      "/orders/{orderId}/invoices",
      "/orders/{orderId}/payments",
    ]);
    expect(document.paths["/orders"]?.post?.responses).toHaveProperty("201");
    expect(document.paths["/orders"]?.post?.responses).toHaveProperty("400");
    expect(
      document.paths["/orders/{orderId}/payments"]?.post?.responses,
    ).toEqual(expect.objectContaining({ "201": expect.anything(), "404": expect.anything() }));
    expect(
      document.paths["/orders/{orderId}/invoices"]?.post?.responses,
    ).toEqual(expect.objectContaining({ "201": expect.anything(), "409": expect.anything() }));
    expect(document.paths["/invoices/{invoiceId}"]?.get?.responses).toEqual(
      expect.objectContaining({ "200": expect.anything(), "404": expect.anything() }),
    );
  });

  it("contains the public request, response, money and error schemas", () => {
    const document = createOpenApiDocument(app);
    const schemas = document.components?.schemas ?? {};

    expect(Object.keys(schemas)).toEqual(
      expect.arrayContaining([
        "CreateOrderRequestDto",
        "CreateOrderResponseDto",
        "CreatePaymentResponseDto",
        "CreateInvoiceRequestDto",
        "CreateInvoiceResponseDto",
        "GetInvoiceResponseDto",
        "MoneyRequestDto",
        "MoneyResponseDto",
        "ApiErrorResponseDto",
        "ValidationIssueDto",
      ]),
    );
    expect(schemas.MoneyRequestDto).toMatchObject({
      required: ["amount", "currency"],
    });
    expect(schemas.ApiErrorDto).toMatchObject({
      required: ["code", "message"],
    });
  });
});
