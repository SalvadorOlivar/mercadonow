import { Injectable } from "@nestjs/common";
import type { InvoiceId, OrderId, PaymentId } from "@mercadonow/shared";

import { InvoiceAlreadyExistsError } from "../../../../../../application/errors/billing-application.errors";
import type { InvoicePort } from "../../../../../../application/ports/out/invoice.port";
import type { Invoice } from "../../../../../../domain/invoice";
import { InvoiceEntity } from "../entity/invoice.entity";
import { InvoiceMapper } from "../mapper/invoice.mapper";
import { EntityManagerContext } from "../entity-manager.context";
import { isPostgresConstraintViolation } from "./query-error";

@Injectable()
export class InvoiceRepository implements InvoicePort {
  constructor(private readonly context: EntityManagerContext) {}

  async findById(id: InvoiceId): Promise<Invoice | null> {
    const entity = await this.context.current
      .getRepository(InvoiceEntity)
      .findOneBy({ id });
    return entity === null ? null : InvoiceMapper.toDomain(entity);
  }

  async findByOrderId(orderId: OrderId): Promise<Invoice | null> {
    const entity = await this.context.current
      .getRepository(InvoiceEntity)
      .findOne({ where: { orderId }, order: { createdAt: "DESC" } });
    return entity === null ? null : InvoiceMapper.toDomain(entity);
  }

  async findByPaymentId(paymentId: PaymentId): Promise<Invoice | null> {
    const entity = await this.context.current
      .getRepository(InvoiceEntity)
      .findOneBy({ paymentId });
    return entity === null ? null : InvoiceMapper.toDomain(entity);
  }

  async save(invoice: Invoice): Promise<void> {
    try {
      await this.context.current
        .getRepository(InvoiceEntity)
        .upsert(InvoiceMapper.toPersistence(invoice), ["id"]);
    } catch (error) {
      if (isPostgresConstraintViolation(error, "invoices_payment_id_key")) {
        throw new InvoiceAlreadyExistsError(invoice.paymentId);
      }
      throw error;
    }
  }
}
