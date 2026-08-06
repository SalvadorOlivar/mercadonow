import { InvoiceEntity } from "../../../../billing/infrastructure/adapters/out/db/typeorm/entity/invoice.entity";
import { OrderItemEntity } from "../../../../billing/infrastructure/adapters/out/db/typeorm/entity/order-item.entity";
import { OrderEntity } from "../../../../billing/infrastructure/adapters/out/db/typeorm/entity/order.entity";
import { PaymentEntity } from "../../../../billing/infrastructure/adapters/out/db/typeorm/entity/payment.entity";

export const POSTGRESQL_ENTITIES = [
  OrderEntity,
  OrderItemEntity,
  PaymentEntity,
  InvoiceEntity,
] as const;
