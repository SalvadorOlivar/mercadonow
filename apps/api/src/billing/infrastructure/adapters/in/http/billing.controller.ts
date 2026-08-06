import { Body, Controller, Get, Param, Post } from "@nestjs/common";
import { asId } from "@mercadonow/shared";

import { CreateInvoice } from "../../../../application/use-cases/create-invoice.use-case";
import { CreateOrder } from "../../../../application/use-cases/create-order.use-case";
import { CreatePayment } from "../../../../application/use-cases/create-payment.use-case";
import { GetInvoice } from "../../../../application/use-cases/get-invoice.use-case";
import {
  ApiBillingController,
  ApiCreateInvoice,
  ApiCreateOrder,
  ApiCreatePayment,
  ApiGetInvoice,
} from "./billing.openapi";
import {
  CreateInvoiceRequestDto,
  CreateOrderRequestDto,
  InvoiceIdParamDto,
  OrderIdParamDto,
} from "./dto/billing-request.dto";

@ApiBillingController()
@Controller()
export class BillingController {
  constructor(
    private readonly createOrder: CreateOrder,
    private readonly createPayment: CreatePayment,
    private readonly createInvoice: CreateInvoice,
    private readonly getInvoice: GetInvoice,
  ) {}

  @Post("orders")
  @ApiCreateOrder()
  createOrderHandler(@Body() body: CreateOrderRequestDto) {
    return this.createOrder.execute({
      customerId: asId(body.customerId, "CustomerId"),
      merchantId: asId(body.merchantId, "MerchantId"),
      deliveryAddress: body.deliveryAddress,
      items: body.items,
    });
  }

  @Post("orders/:orderId/payments")
  @ApiCreatePayment()
  createPaymentHandler(@Param() params: OrderIdParamDto) {
    return this.createPayment.execute({
      orderId: asId(params.orderId, "OrderId"),
    });
  }

  @Post("orders/:orderId/invoices")
  @ApiCreateInvoice()
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
  @ApiGetInvoice()
  getInvoiceHandler(@Param() params: InvoiceIdParamDto) {
    return this.getInvoice.execute({
      invoiceId: asId(params.invoiceId, "InvoiceId"),
    });
  }
}
