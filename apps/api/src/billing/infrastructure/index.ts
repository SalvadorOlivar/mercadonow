/**
 * Infrastructure layer — billing.
 *
 * Adapters that implement outbound domain/application ports: PostgreSQL
 * repositories, transaction management, payment gateways, ID generators.
 * Infrastructure depends inward on the ports it implements.
 */
export * from "./ids/uuid-v7-order-id-generator";
export * from "./ids/uuid-v7-invoice-id-generator";
export * from "./ids/uuid-v7-payment-id-generator";
export * from "./gateways/sandbox-payment.gateway";
export * from "./persistence/postgres-invoice.repository";
export * from "./persistence/postgres-order.repository";
export * from "./persistence/postgres-payment.repository";
export * from "./persistence/postgres-transaction-manager";
