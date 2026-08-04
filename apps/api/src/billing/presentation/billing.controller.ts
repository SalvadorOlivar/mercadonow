import { Body, Controller, Get, Param, Post } from "@nestjs/common";
import { asId } from "@mercadonow/shared";

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

@Controller()
export class BillingController {
  constructor(
    private readonly createOrder: CreateOrder,
    private readonly createPayment: CreatePayment,
    private readonly createInvoice: CreateInvoice,
    private readonly getInvoice: GetInvoice,
  ) {}

  @Post("orders")
  createOrderHandler(@Body() body: CreateOrderRequestDto) {
    return this.createOrder.execute({
      customerId: asId(body.customerId, "CustomerId"),
      merchantId: asId(body.merchantId, "MerchantId"),
      deliveryAddress: body.deliveryAddress,
      items: body.items,
    });
  }

  @Post("orders/:orderId/payments")
  createPaymentHandler(@Param() params: OrderIdParamDto) {
    return this.createPayment.execute({
      orderId: asId(params.orderId, "OrderId"),
    });
  }

  @Post("orders/:orderId/invoices")
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
  getInvoiceHandler(@Param() params: InvoiceIdParamDto) {
    return this.getInvoice.execute({
      invoiceId: asId(params.invoiceId, "InvoiceId"),
    });
  }
}
