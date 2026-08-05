import { Body, Controller, Get, Param, Post } from "@nestjs/common";
import { asId, UUID_V7_PATTERN } from "@mercadonow/shared";
import {
  ApiBadRequestResponse,
  ApiBody,
  ApiConflictResponse,
  ApiCreatedResponse,
  ApiInternalServerErrorResponse,
  ApiNotFoundResponse,
  ApiOkResponse,
  ApiOperation,
  ApiParam,
  ApiTags,
} from "@nestjs/swagger";

import { CreateInvoice } from "../application/use-cases/create-invoice.use-case";
import { CreateOrder } from "../application/use-cases/create-order.use-case";
import { CreatePayment } from "../application/use-cases/create-payment.use-case";
import { GetInvoice } from "../application/use-cases/get-invoice.use-case";
import {
  CreateInvoiceRequestDto,
  CreateOrderRequestDto,
  InvoiceIdParamDto,
  OrderIdParamDto,
} from "./dtos/billing-request.dto";
import {
  ApiErrorResponseDto,
  CreateInvoiceResponseDto,
  CreateOrderResponseDto,
  CreatePaymentResponseDto,
  GetInvoiceResponseDto,
} from "./dtos/billing-response.dto";

const orderIdExample = "0198f5ef-b5bd-7c86-a7b2-bc32c5c57890";
const paymentIdExample = "0198f5ef-b5bd-7c86-a7b2-bc32c5c57891";
const invoiceIdExample = "0198f5ef-b5bd-7c86-a7b2-bc32c5c57892";

@ApiTags("Billing")
@ApiInternalServerErrorResponse({
  type: ApiErrorResponseDto,
  description: "Unexpected failure; implementation details are sanitized.",
  example: {
    statusCode: 500,
    error: { code: "INTERNAL_ERROR", message: "Internal server error" },
  },
})
@Controller()
export class BillingController {
  constructor(
    private readonly createOrder: CreateOrder,
    private readonly createPayment: CreatePayment,
    private readonly createInvoice: CreateInvoice,
    private readonly getInvoice: GetInvoice,
  ) {}

  @Post("orders")
  @ApiOperation({ summary: "Create an order" })
  @ApiBody({
    type: CreateOrderRequestDto,
    examples: {
      order: {
        value: {
          customerId: "0198f5ef-b5bd-7c86-a7b2-bc32c5c57888",
          merchantId: "0198f5ef-b5bd-7c86-a7b2-bc32c5c57889",
          deliveryAddress: "Av. Siempre Viva 742",
          items: [
            {
              productId: "product-1",
              quantity: 2,
              unitPrice: { amount: 1500, currency: "ARS" },
            },
          ],
        },
      },
    },
  })
  @ApiCreatedResponse({
    type: CreateOrderResponseDto,
    example: {
      orderId: orderIdExample,
      status: "PENDING_PAYMENT",
      total: { amount: 3000, currency: "ARS" },
    },
  })
  @ApiBadRequestResponse({
    type: ApiErrorResponseDto,
    description: "Invalid request or domain input.",
    example: {
      statusCode: 400,
      error: {
        code: "VALIDATION_ERROR",
        message: "Request validation failed",
        details: [{ path: "items", messages: ["items must contain at least 1 elements"] }],
      },
    },
  })
  createOrderHandler(@Body() body: CreateOrderRequestDto) {
    return this.createOrder.execute({
      customerId: asId(body.customerId, "CustomerId"),
      merchantId: asId(body.merchantId, "MerchantId"),
      deliveryAddress: body.deliveryAddress,
      items: body.items,
    });
  }

  @Post("orders/:orderId/payments")
  @ApiOperation({ summary: "Create and process a payment for an order" })
  @ApiParam({
    name: "orderId",
    schema: {
      type: "string",
      format: "uuid",
      pattern: UUID_V7_PATTERN,
      example: orderIdExample,
    },
  })
  @ApiCreatedResponse({
    type: CreatePaymentResponseDto,
    example: {
      paymentId: paymentIdExample,
      orderId: orderIdExample,
      status: "AUTHORIZED",
      amount: { amount: 3000, currency: "ARS" },
      providerReference: "sandbox-0198f5ef",
    },
  })
  @ApiBadRequestResponse({ type: ApiErrorResponseDto, description: "Invalid UUID v7." })
  @ApiNotFoundResponse({
    type: ApiErrorResponseDto,
    description: "Order not found.",
    example: {
      statusCode: 404,
      error: { code: "ORDER_NOT_FOUND", message: `Order ${orderIdExample} was not found` },
    },
  })
  @ApiConflictResponse({
    type: ApiErrorResponseDto,
    description: "The order cannot transition to the required state.",
  })
  createPaymentHandler(@Param() params: OrderIdParamDto) {
    return this.createPayment.execute({
      orderId: asId(params.orderId, "OrderId"),
    });
  }

  @Post("orders/:orderId/invoices")
  @ApiOperation({ summary: "Create an invoice for an authorized payment" })
  @ApiParam({
    name: "orderId",
    schema: {
      type: "string",
      format: "uuid",
      pattern: UUID_V7_PATTERN,
      example: orderIdExample,
    },
  })
  @ApiBody({
    type: CreateInvoiceRequestDto,
    examples: { invoice: { value: { paymentId: paymentIdExample } } },
  })
  @ApiCreatedResponse({
    type: CreateInvoiceResponseDto,
    example: {
      invoiceId: invoiceIdExample,
      orderId: orderIdExample,
      paymentId: paymentIdExample,
      status: "ISSUED",
      total: { amount: 3000, currency: "ARS" },
    },
  })
  @ApiBadRequestResponse({ type: ApiErrorResponseDto, description: "Invalid UUID v7." })
  @ApiNotFoundResponse({
    type: ApiErrorResponseDto,
    description: "Order or payment not found.",
  })
  @ApiConflictResponse({
    type: ApiErrorResponseDto,
    description: "Payment mismatch, unauthorized payment, or invoice already exists.",
    example: {
      statusCode: 409,
      error: {
        code: "INVOICE_ALREADY_EXISTS",
        message: `An invoice already exists for payment ${paymentIdExample}`,
      },
    },
  })
  createInvoiceHandler(
    @Param() params: OrderIdParamDto,
    @Body() body: CreateInvoiceRequestDto,
  ) {
    return this.createInvoice.execute({
      orderId: asId(params.orderId, "OrderId"),
      paymentId: asId(body.paymentId, "PaymentId"),
    });
  }

  @Get("invoices/:invoiceId")
  @ApiOperation({ summary: "Get an invoice by ID" })
  @ApiParam({
    name: "invoiceId",
    schema: {
      type: "string",
      format: "uuid",
      pattern: UUID_V7_PATTERN,
      example: invoiceIdExample,
    },
  })
  @ApiOkResponse({
    type: GetInvoiceResponseDto,
    example: {
      invoiceId: invoiceIdExample,
      orderId: orderIdExample,
      paymentId: paymentIdExample,
      status: "ISSUED",
      total: { amount: 3000, currency: "ARS" },
    },
  })
  @ApiBadRequestResponse({ type: ApiErrorResponseDto, description: "Invalid UUID v7." })
  @ApiNotFoundResponse({
    type: ApiErrorResponseDto,
    description: "Invoice not found.",
    example: {
      statusCode: 404,
      error: {
        code: "INVOICE_NOT_FOUND",
        message: `Invoice ${invoiceIdExample} was not found`,
      },
    },
  })
  getInvoiceHandler(@Param() params: InvoiceIdParamDto) {
    return this.getInvoice.execute({
      invoiceId: asId(params.invoiceId, "InvoiceId"),
    });
  }
}
