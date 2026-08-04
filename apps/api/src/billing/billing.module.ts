/**
 * Billing module — modular monolith boundary.
 *
 * Internal layering (Clean Architecture):
 *   domain/          Entities, value objects, domain errors, ports (interfaces).
 *                    No NestJS, no ORM, no I/O. Pure TypeScript.
 *   application/     Use cases and orchestration ports. Depends on domain.
 *   infrastructure/  Adapters: PostgreSQL repositories, external gateways.
 *   presentation/    NestJS controllers, DTOs, exception filters.
 *
 * Dependency direction: presentation -> application -> domain, while
 * infrastructure -> application/domain to implement outbound ports.
 * BillingModule is the composition root and may import every layer.
 */
import { Module, ValidationPipe } from "@nestjs/common";
import { APP_FILTER, APP_PIPE } from "@nestjs/core";
import { DatabaseModule } from "../database/database.module";
import { CreateInvoice } from "./application/use-cases/create-invoice.use-case";
import { CreateOrder } from "./application/use-cases/create-order.use-case";
import { CreatePayment } from "./application/use-cases/create-payment.use-case";
import { GetInvoice } from "./application/use-cases/get-invoice.use-case";
import type { PaymentGateway } from "./application/ports/payment-gateway";
import type { InvoiceIdGenerator } from "./application/ports/invoice-id-generator";
import type { OrderIdGenerator } from "./application/ports/order-id-generator";
import type { PaymentIdGenerator } from "./application/ports/payment-id-generator";
import {
  TRANSACTION_MANAGER,
  type TransactionManager,
} from "./application/ports/transaction-manager";
import { INVOICE_REPOSITORY } from "./domain/repositories/invoice.repository";
import { ORDER_REPOSITORY } from "./domain/repositories/order.repository";
import { PAYMENT_REPOSITORY } from "./domain/repositories/payment.repository";
import { PostgresInvoiceRepository } from "./infrastructure/persistence/postgres-invoice.repository";
import { PostgresOrderRepository } from "./infrastructure/persistence/postgres-order.repository";
import { PostgresPaymentRepository } from "./infrastructure/persistence/postgres-payment.repository";
import { PostgresTransactionManager } from "./infrastructure/persistence/postgres-transaction-manager";
import { SandboxPaymentGateway } from "./infrastructure/gateways/sandbox-payment.gateway";
import { UuidV7InvoiceIdGenerator } from "./infrastructure/ids/uuid-v7-invoice-id-generator";
import { UuidV7OrderIdGenerator } from "./infrastructure/ids/uuid-v7-order-id-generator";
import { UuidV7PaymentIdGenerator } from "./infrastructure/ids/uuid-v7-payment-id-generator";
import { BillingController } from "./presentation/billing.controller";
import { BillingExceptionFilter } from "./presentation/billing-exception.filter";
import type { InvoiceRepository } from "./domain/repositories/invoice.repository";
import type { OrderRepository } from "./domain/repositories/order.repository";
import type { PaymentRepository } from "./domain/repositories/payment.repository";

@Module({
  imports: [DatabaseModule],
  controllers: [BillingController],
  providers: [
    { provide: ORDER_REPOSITORY, useClass: PostgresOrderRepository },
    { provide: PAYMENT_REPOSITORY, useClass: PostgresPaymentRepository },
    { provide: INVOICE_REPOSITORY, useClass: PostgresInvoiceRepository },
    { provide: TRANSACTION_MANAGER, useClass: PostgresTransactionManager },
    UuidV7OrderIdGenerator,
    UuidV7PaymentIdGenerator,
    UuidV7InvoiceIdGenerator,
    SandboxPaymentGateway,
    {
      provide: CreateOrder,
      inject: [ORDER_REPOSITORY, TRANSACTION_MANAGER, UuidV7OrderIdGenerator],
      useFactory: (
        orders: OrderRepository,
        transactions: TransactionManager,
        ids: OrderIdGenerator,
      ) => new CreateOrder(orders, transactions, ids),
    },
    {
      provide: CreatePayment,
      inject: [
        ORDER_REPOSITORY,
        PAYMENT_REPOSITORY,
        TRANSACTION_MANAGER,
        UuidV7PaymentIdGenerator,
        SandboxPaymentGateway,
      ],
      useFactory: (
        orders: OrderRepository,
        payments: PaymentRepository,
        transactions: TransactionManager,
        ids: PaymentIdGenerator,
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
        UuidV7InvoiceIdGenerator,
      ],
      useFactory: (
        orders: OrderRepository,
        payments: PaymentRepository,
        invoices: InvoiceRepository,
        transactions: TransactionManager,
        ids: InvoiceIdGenerator,
      ) => new CreateInvoice(orders, payments, invoices, transactions, ids),
    },
    {
      provide: GetInvoice,
      inject: [INVOICE_REPOSITORY],
      useFactory: (invoices: InvoiceRepository) => new GetInvoice(invoices),
    },
    {
      provide: APP_PIPE,
      useValue: new ValidationPipe({
        transform: true,
        whitelist: true,
        forbidNonWhitelisted: true,
      }),
    },
    { provide: APP_FILTER, useClass: BillingExceptionFilter },
  ],
  exports: [
    ORDER_REPOSITORY,
    PAYMENT_REPOSITORY,
    INVOICE_REPOSITORY,
    TRANSACTION_MANAGER,
  ],
})
export class BillingModule {}
