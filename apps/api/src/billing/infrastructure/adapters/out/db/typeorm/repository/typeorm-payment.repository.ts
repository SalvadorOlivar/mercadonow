import { Injectable } from "@nestjs/common";
import type { OrderId, PaymentId } from "@mercadonow/shared";

import { ActivePaymentAlreadyExistsError } from "../../../../../../application/errors/billing-application.errors";
import type { Payment } from "../../../../../../domain/entities/payment.entity";
import type { PaymentRepository } from "../../../../../../domain/repositories/payment.repository";
import { PaymentTypeOrmEntity } from "../entity/payment.typeorm-entity";
import { PaymentTypeOrmMapper } from "../mapper/payment.typeorm-mapper";
import { TypeOrmEntityManagerContext } from "../typeorm-entity-manager.context";
import { isPostgresConstraintViolation } from "./typeorm-query-error";

@Injectable()
export class TypeOrmPaymentRepository implements PaymentRepository {
  constructor(private readonly context: TypeOrmEntityManagerContext) {}

  async findById(id: PaymentId): Promise<Payment | null> {
    const entity = await this.context.current
      .getRepository(PaymentTypeOrmEntity)
      .findOneBy({ id });
    return entity === null ? null : PaymentTypeOrmMapper.toDomain(entity);
  }

  async findByOrderId(orderId: OrderId): Promise<readonly Payment[]> {
    const entities = await this.context.current
      .getRepository(PaymentTypeOrmEntity)
      .find({ where: { orderId }, order: { createdAt: "ASC", id: "ASC" } });
    return entities.map((entity) => PaymentTypeOrmMapper.toDomain(entity));
  }

  async save(payment: Payment): Promise<void> {
    try {
      await this.context.current
        .getRepository(PaymentTypeOrmEntity)
        .upsert(PaymentTypeOrmMapper.toPersistence(payment), ["id"]);
    } catch (error) {
      if (
        isPostgresConstraintViolation(
          error,
          "payments_one_active_per_order_uq",
        )
      ) {
        throw new ActivePaymentAlreadyExistsError(payment.orderId);
      }
      throw error;
    }
  }
}
