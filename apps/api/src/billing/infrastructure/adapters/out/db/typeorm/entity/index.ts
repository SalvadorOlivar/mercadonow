import { InvoiceEntity } from "./invoice.entity";
import { OrderItemEntity } from "./order-item.entity";
import { OrderEntity } from "./order.entity";
import { PaymentEntity } from "./payment.entity";

export const BILLING_TYPEORM_ENTITIES = [
  OrderEntity,
  OrderItemEntity,
  PaymentEntity,
  InvoiceEntity,
] as const;

export { InvoiceEntity } from "./invoice.entity";
export { OrderItemEntity } from "./order-item.entity";
export { OrderEntity } from "./order.entity";
export { PaymentEntity } from "./payment.entity";
