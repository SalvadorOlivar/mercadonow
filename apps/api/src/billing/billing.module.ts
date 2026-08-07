import {
  asId,
  type InvoiceId,
  type OrderId,
  type PaymentId,
} from "@mercadonow/shared";
import { Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";
import { CreateInvoice } from "./application/use-cases/create-invoice.use-case";
import { CreateOrder } from "./application/use-cases/create-order.use-case";
import { CreatePayment } from "./application/use-cases/create-payment.use-case";
import { GetInvoice } from "./application/use-cases/get-invoice.use-case";
import type { PaymentGateway } from "./application/use-cases/interfaces/payment-gateway";
import {
  INVOICE_ID_GENERATOR,
  ORDER_ID_GENERATOR,
  PAYMENT_ID_GENERATOR,
  type IdGenerator,
} from "./application/ports/out/id-generator.port";
import {
  TRANSACTION_MANAGER,
  type TransactionManagerPort,
} from "./application/ports/out/transaction-manager.port";
import { INVOICE_REPOSITORY } from "./application/ports/out/invoice.port";
import { ORDER_REPOSITORY } from "./application/ports/out/order.port";
import { PAYMENT_REPOSITORY } from "./application/ports/out/payment.port";
import { BillingController } from "./infrastructure/adapters/in/http/billing.controller";
import { BILLING_TYPEORM_ENTITIES } from "./infrastructure/adapters/out/db/typeorm/entity";
import { InvoiceRepository } from "./infrastructure/adapters/out/db/typeorm/repository/invoice.repository";
import { OrderRepository } from "./infrastructure/adapters/out/db/typeorm/repository/order.repository";
import { PaymentRepository } from "./infrastructure/adapters/out/db/typeorm/repository/payment.repository";
import { EntityManagerContext } from "./infrastructure/adapters/out/db/typeorm/entity-manager.context";
import { TransactionManager } from "./infrastructure/adapters/out/db/typeorm/transaction.manager";
import { SandboxPaymentGateway } from "./infrastructure/adapters/out/integration/sandbox-payment.gateway";
import { UuidV7IdGenerator } from "./infrastructure/adapters/out/id/uuid-v7-id-generator";
import type { InvoicePort } from "./application/ports/out/invoice.port";
import type { OrderPort } from "./application/ports/out/order.port";
import type { PaymentPort } from "./application/ports/out/payment.port";

@Module({
  imports: [TypeOrmModule.forFeature([...BILLING_TYPEORM_ENTITIES])],
  controllers: [BillingController],
  providers: [
    EntityManagerContext,
    { provide: ORDER_REPOSITORY, useClass: OrderRepository },
    { provide: PAYMENT_REPOSITORY, useClass: PaymentRepository },
    { provide: INVOICE_REPOSITORY, useClass: InvoiceRepository },
    { provide: TRANSACTION_MANAGER, useClass: TransactionManager },
    {
      provide: ORDER_ID_GENERATOR,
      useFactory: () =>
        new UuidV7IdGenerator((value) => asId(value, "OrderId")),
    },
    {
      provide: PAYMENT_ID_GENERATOR,
      useFactory: () =>
        new UuidV7IdGenerator((value) => asId(value, "PaymentId")),
    },
    {
      provide: INVOICE_ID_GENERATOR,
      useFactory: () =>
        new UuidV7IdGenerator((value) => asId(value, "InvoiceId")),
    },
    SandboxPaymentGateway,
    {
      provide: CreateOrder,
      inject: [ORDER_REPOSITORY, TRANSACTION_MANAGER, ORDER_ID_GENERATOR],
      useFactory: (
        orders: OrderPort,
        transactions: TransactionManagerPort,
        ids: IdGenerator<OrderId>,
      ) => new CreateOrder(orders, transactions, ids),
    },
    {
      provide: CreatePayment,
      inject: [
        ORDER_REPOSITORY,
        PAYMENT_REPOSITORY,
        TRANSACTION_MANAGER,
        PAYMENT_ID_GENERATOR,
        SandboxPaymentGateway,
      ],
      useFactory: (
        orders: OrderPort,
        payments: PaymentPort,
        transactions: TransactionManagerPort,
        ids: IdGenerator<PaymentId>,
        gateway: PaymentGateway,
      ) => new CreatePayment(orders, payments, transactions, ids, gateway),
    },
    {
      provide: CreateInvoice,
      inject: [
        ORDER_REPOSITORY,
        PAYMENT_REPOSITORY,
        INVOICE_REPOSITORY,
        TRANSACTION_MANAGER,
        INVOICE_ID_GENERATOR,
      ],
      useFactory: (
        orders: OrderPort,
        payments: PaymentPort,
        invoices: InvoicePort,
        transactions: TransactionManagerPort,
        ids: IdGenerator<InvoiceId>,
      ) => new CreateInvoice(orders, payments, invoices, transactions, ids),
    },
    {
      provide: GetInvoice,
      inject: [INVOICE_REPOSITORY],
      useFactory: (invoices: InvoicePort) => new GetInvoice(invoices),
    },
  ],
  exports: [
    ORDER_REPOSITORY,
    PAYMENT_REPOSITORY,
    INVOICE_REPOSITORY,
    TRANSACTION_MANAGER,
  ],
})
export class BillingModule {}
