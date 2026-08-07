import { Injectable } from "@nestjs/common";
import type { OrderId, PaymentId } from "@mercadonow/shared";

import { ActivePaymentAlreadyExistsError } from "../../../../../../application/errors/billing-application.errors";
import type { PaymentPort } from "../../../../../../application/ports/out/payment.port";
import type { Payment } from "../../../../../../domain/payment";
import { PaymentEntity } from "../entity/payment.entity";
import { PaymentMapper } from "../mapper/payment.mapper";
import { EntityManagerContext } from "../entity-manager.context";
import { isPostgresConstraintViolation } from "./query-error";

@Injectable()
export class PaymentRepository implements PaymentPort {
  constructor(private readonly context: EntityManagerContext) {}

  async findById(id: PaymentId): Promise<Payment | null> {
    const entity = await this.context.current
      .getRepository(PaymentEntity)
      .findOneBy({ id });
    return entity === null ? null : PaymentMapper.toDomain(entity);
  }

  async findByOrderId(orderId: OrderId): Promise<readonly Payment[]> {
    const entities = await this.context.current
      .getRepository(PaymentEntity)
      .find({ where: { orderId }, order: { createdAt: "ASC", id: "ASC" } });
    return entities.map((entity) => PaymentMapper.toDomain(entity));
  }

  async save(payment: Payment): Promise<void> {
    try {
      await this.context.current
        .getRepository(PaymentEntity)
        .upsert(PaymentMapper.toPersistence(payment), ["id"]);
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
