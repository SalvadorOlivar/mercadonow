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
import { BillingController } from "./infrastructure/adapters/in/http/billing.controller";
import { BILLING_TYPEORM_ENTITIES } from "./infrastructure/adapters/out/db/typeorm/entity";
import { TypeOrmInvoiceRepository } from "./infrastructure/adapters/out/db/typeorm/repository/typeorm-invoice.repository";
import { TypeOrmOrderRepository } from "./infrastructure/adapters/out/db/typeorm/repository/typeorm-order.repository";
import { TypeOrmPaymentRepository } from "./infrastructure/adapters/out/db/typeorm/repository/typeorm-payment.repository";
import { TypeOrmEntityManagerContext } from "./infrastructure/adapters/out/db/typeorm/typeorm-entity-manager.context";
import { TypeOrmTransactionManager } from "./infrastructure/adapters/out/db/typeorm/typeorm-transaction.manager";
import { UuidV7InvoiceIdGenerator } from "./infrastructure/adapters/out/id/uuid-v7-invoice-id-generator";
import { UuidV7OrderIdGenerator } from "./infrastructure/adapters/out/id/uuid-v7-order-id-generator";
import { UuidV7PaymentIdGenerator } from "./infrastructure/adapters/out/id/uuid-v7-payment-id-generator";
import { SandboxPaymentGateway } from "./infrastructure/adapters/out/integration/sandbox-payment.gateway";
import type { InvoiceRepository } from "./domain/repositories/invoice.repository";
import type { OrderRepository } from "./domain/repositories/order.repository";
import type { PaymentRepository } from "./domain/repositories/payment.repository";

@Module({
  imports: [DatabaseModule, TypeOrmModule.forFeature([...BILLING_TYPEORM_ENTITIES])],
  controllers: [BillingController],
  providers: [
    TypeOrmEntityManagerContext,
    { provide: ORDER_REPOSITORY, useClass: TypeOrmOrderRepository },
    { provide: PAYMENT_REPOSITORY, useClass: TypeOrmPaymentRepository },
    { provide: INVOICE_REPOSITORY, useClass: TypeOrmInvoiceRepository },
    { provide: TRANSACTION_MANAGER, useClass: TypeOrmTransactionManager },
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
  ],
  exports: [
    ORDER_REPOSITORY,
    PAYMENT_REPOSITORY,
    INVOICE_REPOSITORY,
    TRANSACTION_MANAGER,
  ],
})
export class BillingModule {}
