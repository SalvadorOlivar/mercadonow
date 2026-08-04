import { Injectable } from "@nestjs/common";
import type {
  OrderId,
  PaymentId,
  PaymentStatus,
} from "@mercadonow/shared";

import { DatabaseService } from "../../../database/database.service";
import { Payment } from "../../domain/entities/payment.entity";
import type { PaymentRepository } from "../../domain/repositories/payment.repository";
import { Money } from "../../domain/value-objects/money";

interface PaymentRow {
  readonly id: string;
  readonly order_id: string;
  readonly amount: string;
  readonly currency: "ARS" | "USD" | "EUR";
  readonly status: PaymentStatus;
  readonly provider_reference: string | null;
}

@Injectable()
export class PostgresPaymentRepository implements PaymentRepository {
  constructor(private readonly database: DatabaseService) {}

  async findById(id: PaymentId): Promise<Payment | null> {
    const result = await this.database.query<PaymentRow>(
      "SELECT id, order_id, amount, currency, status, provider_reference FROM payments WHERE id = $1",
      [id],
    );
    return result.rows[0] === undefined ? null : this.toDomain(result.rows[0]);
  }

  async findByOrderId(orderId: OrderId): Promise<readonly Payment[]> {
    const result = await this.database.query<PaymentRow>(
      `SELECT id, order_id, amount, currency, status, provider_reference
         FROM payments WHERE order_id = $1 ORDER BY created_at, id`,
      [orderId],
    );
    return result.rows.map((row) => this.toDomain(row));
  }

  async save(payment: Payment): Promise<void> {
    await this.database.query(
      `INSERT INTO payments
         (id, order_id, amount, currency, status, provider_reference)
       VALUES ($1, $2, $3, $4, $5, $6)
       ON CONFLICT (id) DO UPDATE SET
         order_id = EXCLUDED.order_id,
         amount = EXCLUDED.amount,
         currency = EXCLUDED.currency,
         status = EXCLUDED.status,
         provider_reference = EXCLUDED.provider_reference,
         updated_at = now()`,
      [
        payment.id,
        payment.orderId,
        payment.amount.amount,
        payment.amount.currency,
        payment.status,
        payment.providerReference ?? null,
      ],
    );
  }

  private toDomain(row: PaymentRow): Payment {
    return new Payment({
      id: row.id as PaymentId,
      orderId: row.order_id as OrderId,
      amount: new Money(Number(row.amount), row.currency),
      status: row.status,
      providerReference: row.provider_reference ?? undefined,
    });
  }
}

