/**
 * Domain layer — billing.
 *
 * Entities, value objects, domain errors, and repository PORTS (interfaces).
 * Must not import anything from application, infrastructure, or presentation.
 * Must not import NestJS, pg, or any I/O library.
 */
export * from "./entities/invoice.entity";
export * from "./entities/order.entity";
export * from "./entities/payment.entity";
export * from "./errors/domain-validation.error";
export * from "./errors/invalid-state-transition.error";
export * from "./repositories/invoice.repository";
export * from "./repositories/order.repository";
export * from "./repositories/payment.repository";
export * from "./repositories/transaction-manager";
export * from "./value-objects/money";
