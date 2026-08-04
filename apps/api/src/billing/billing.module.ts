/**
 * Billing module — modular monolith boundary.
 *
 * Internal layering (Clean Architecture):
 *   domain/          Entities, value objects, domain errors, ports (interfaces).
 *                    No NestJS, no ORM, no I/O. Pure TypeScript.
 *   application/     Use cases orchestrating the domain. Depends on ports only.
 *   infrastructure/  Adapters: PostgreSQL repositories, external gateways.
 *   presentation/    NestJS controllers, DTOs, exception filters.
 *
 * Dependency direction: presentation -> application -> domain <- infrastructure.
 * Domain never imports from outer layers.
 */
import { Module } from "@nestjs/common";
import { DatabaseModule } from "../database/database.module";
import { INVOICE_REPOSITORY } from "./domain/repositories/invoice.repository";
import { ORDER_REPOSITORY } from "./domain/repositories/order.repository";
import { PAYMENT_REPOSITORY } from "./domain/repositories/payment.repository";
import { TRANSACTION_MANAGER } from "./domain/repositories/transaction-manager";
import { PostgresInvoiceRepository } from "./infrastructure/persistence/postgres-invoice.repository";
import { PostgresOrderRepository } from "./infrastructure/persistence/postgres-order.repository";
import { PostgresPaymentRepository } from "./infrastructure/persistence/postgres-payment.repository";
import { PostgresTransactionManager } from "./infrastructure/persistence/postgres-transaction-manager";

@Module({
  imports: [DatabaseModule],
  providers: [
    { provide: ORDER_REPOSITORY, useClass: PostgresOrderRepository },
    { provide: PAYMENT_REPOSITORY, useClass: PostgresPaymentRepository },
    { provide: INVOICE_REPOSITORY, useClass: PostgresInvoiceRepository },
    { provide: TRANSACTION_MANAGER, useClass: PostgresTransactionManager },
  ],
  exports: [
    ORDER_REPOSITORY,
    PAYMENT_REPOSITORY,
    INVOICE_REPOSITORY,
    TRANSACTION_MANAGER,
  ],
})
export class BillingModule {}
