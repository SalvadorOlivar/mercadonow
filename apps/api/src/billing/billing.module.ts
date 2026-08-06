/**
 * Billing module — modular monolith boundary.
 *
 * Internal layering (Clean Architecture):
 *   domain/          Entities, value objects, domain errors, ports (interfaces).
 *                    No NestJS, no ORM, no I/O. Pure TypeScript.
 *   application/     Use cases and orchestration ports. Depends on domain.
 *   infrastructure/adapters/in/   HTTP controllers and DTOs.
 *   infrastructure/adapters/out/  TypeORM repositories and external adapters.
 *
 * Dependency direction: adapters -> application -> domain. Inbound and
 * outbound adapters do not depend on one another.
 * BillingModule is the composition root and may import every layer.
 */
import { Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";
import { DatabaseModule } from "../database/database.module";
import { CreateInvoice } from "./application/use-cases/create-invoice.use-case";
import { CreateOrder } from "./application/use-cases/create-order.use-case";
import { CreatePayment } from "./application/use-cases/create-payment.use-case";
import { GetInvoice } from "./application/use-cases/get-invoice.use-case";
import type { PaymentGateway } from "./application/ports/out/payment-gateway";
import type { InvoiceIdGenerator } from "./application/ports/out/invoice-id-generator";
import type { OrderIdGenerator } from "./application/ports/out/order-id-generator";
import type { PaymentIdGenerator } from "./application/ports/out/payment-id-generator";
import {
  TRANSACTION_MANAGER,
  type TransactionManagerPort,
} from "./application/ports/out/transaction-manager";
import { INVOICE_REPOSITORY } from "./application/ports/out/invoice-repository";
import { ORDER_REPOSITORY } from "./application/ports/out/order-repository";
import { PAYMENT_REPOSITORY } from "./application/ports/out/payment-repository";
import { BillingController } from "./infrastructure/adapters/in/http/billing.controller";
import { BILLING_TYPEORM_ENTITIES } from "./infrastructure/adapters/out/db/typeorm/entity";
import { InvoiceRepository } from "./infrastructure/adapters/out/db/typeorm/repository/invoice.repository";
import { OrderRepository } from "./infrastructure/adapters/out/db/typeorm/repository/order.repository";
import { PaymentRepository } from "./infrastructure/adapters/out/db/typeorm/repository/payment.repository";
import { EntityManagerContext } from "./infrastructure/adapters/out/db/typeorm/entity-manager.context";
import { TransactionManager } from "./infrastructure/adapters/out/db/typeorm/transaction.manager";
import { UuidV7InvoiceIdGenerator } from "./infrastructure/adapters/out/id/uuid-v7-invoice-id-generator";
import { UuidV7OrderIdGenerator } from "./infrastructure/adapters/out/id/uuid-v7-order-id-generator";
import { UuidV7PaymentIdGenerator } from "./infrastructure/adapters/out/id/uuid-v7-payment-id-generator";
import { SandboxPaymentGateway } from "./infrastructure/adapters/out/integration/sandbox-payment.gateway";
import type { InvoiceRepositoryPort } from "./application/ports/out/invoice-repository";
import type { OrderRepositoryPort } from "./application/ports/out/order-repository";
import type { PaymentRepositoryPort } from "./application/ports/out/payment-repository";

@Module({
  imports: [DatabaseModule, TypeOrmModule.forFeature([...BILLING_TYPEORM_ENTITIES])],
  controllers: [BillingController],
  providers: [
    EntityManagerContext,
    { provide: ORDER_REPOSITORY, useClass: OrderRepository },
    { provide: PAYMENT_REPOSITORY, useClass: PaymentRepository },
    { provide: INVOICE_REPOSITORY, useClass: InvoiceRepository },
    { provide: TRANSACTION_MANAGER, useClass: TransactionManager },
    UuidV7OrderIdGenerator,
    UuidV7PaymentIdGenerator,
    UuidV7InvoiceIdGenerator,
    SandboxPaymentGateway,
    {
      provide: CreateOrder,
      inject: [ORDER_REPOSITORY, TRANSACTION_MANAGER, UuidV7OrderIdGenerator],
      useFactory: (
        orders: OrderRepositoryPort,
        transactions: TransactionManagerPort,
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
        orders: OrderRepositoryPort,
        payments: PaymentRepositoryPort,
        transactions: TransactionManagerPort,
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
        orders: OrderRepositoryPort,
        payments: PaymentRepositoryPort,
        invoices: InvoiceRepositoryPort,
        transactions: TransactionManagerPort,
        ids: InvoiceIdGenerator,
      ) => new CreateInvoice(orders, payments, invoices, transactions, ids),
    },
    {
      provide: GetInvoice,
      inject: [INVOICE_REPOSITORY],
      useFactory: (invoices: InvoiceRepositoryPort) => new GetInvoice(invoices),
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
