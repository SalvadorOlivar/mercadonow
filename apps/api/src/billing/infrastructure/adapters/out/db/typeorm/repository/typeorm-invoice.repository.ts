import { Injectable } from "@nestjs/common";
import type { InvoiceId, OrderId, PaymentId } from "@mercadonow/shared";

import { InvoiceAlreadyExistsError } from "../../../../../../application/errors/billing-application.errors";
import type { Invoice } from "../../../../../../domain/entities/invoice.entity";
import type { InvoiceRepository } from "../../../../../../domain/repositories/invoice.repository";
import { InvoiceTypeOrmEntity } from "../entity/invoice.typeorm-entity";
import { InvoiceTypeOrmMapper } from "../mapper/invoice.typeorm-mapper";
import { TypeOrmEntityManagerContext } from "../typeorm-entity-manager.context";
import { isPostgresConstraintViolation } from "./typeorm-query-error";

@Injectable()
export class TypeOrmInvoiceRepository implements InvoiceRepository {
  constructor(private readonly context: TypeOrmEntityManagerContext) {}

  async findById(id: InvoiceId): Promise<Invoice | null> {
    const entity = await this.context.current
      .getRepository(InvoiceTypeOrmEntity)
      .findOneBy({ id });
    return entity === null ? null : InvoiceTypeOrmMapper.toDomain(entity);
  }

  async findByOrderId(orderId: OrderId): Promise<Invoice | null> {
    const entity = await this.context.current
      .getRepository(InvoiceTypeOrmEntity)
      .findOne({ where: { orderId }, order: { createdAt: "DESC" } });
    return entity === null ? null : InvoiceTypeOrmMapper.toDomain(entity);
  }

  async findByPaymentId(paymentId: PaymentId): Promise<Invoice | null> {
    const entity = await this.context.current
      .getRepository(InvoiceTypeOrmEntity)
      .findOneBy({ paymentId });
    return entity === null ? null : InvoiceTypeOrmMapper.toDomain(entity);
  }

  async save(invoice: Invoice): Promise<void> {
    try {
      await this.context.current
        .getRepository(InvoiceTypeOrmEntity)
        .upsert(InvoiceTypeOrmMapper.toPersistence(invoice), ["id"]);
    } catch (error) {
      if (isPostgresConstraintViolation(error, "invoices_payment_id_key")) {
        throw new InvoiceAlreadyExistsError(invoice.paymentId);
      }
      throw error;
    }
  }
}
