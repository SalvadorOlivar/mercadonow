import { Injectable } from "@nestjs/common";
import type {
  InvoiceId,
  InvoiceStatus,
  OrderId,
  PaymentId,
} from "@mercadonow/shared";

import { DatabaseService } from "../../../database/database.service";
import { Invoice } from "../../domain/entities/invoice.entity";
import type { InvoiceRepository } from "../../domain/repositories/invoice.repository";
import { Money } from "../../domain/value-objects/money";

interface InvoiceRow {
  readonly id: string;
  readonly order_id: string;
  readonly payment_id: string;
  readonly total_amount: string;
  readonly currency: "ARS" | "USD" | "EUR";
  readonly status: InvoiceStatus;
}

@Injectable()
export class PostgresInvoiceRepository implements InvoiceRepository {
  constructor(private readonly database: DatabaseService) {}

  async findById(id: InvoiceId): Promise<Invoice | null> {
    const result = await this.database.query<InvoiceRow>(
      "SELECT id, order_id, payment_id, total_amount, currency, status FROM invoices WHERE id = $1",
      [id],
    );
    return result.rows[0] === undefined ? null : this.toDomain(result.rows[0]);
  }

  async findByOrderId(orderId: OrderId): Promise<Invoice | null> {
    const result = await this.database.query<InvoiceRow>(
      `SELECT id, order_id, payment_id, total_amount, currency, status
         FROM invoices WHERE order_id = $1 ORDER BY created_at DESC LIMIT 1`,
      [orderId],
    );
    return result.rows[0] === undefined ? null : this.toDomain(result.rows[0]);
  }

  async findByPaymentId(paymentId: PaymentId): Promise<Invoice | null> {
    const result = await this.database.query<InvoiceRow>(
      "SELECT id, order_id, payment_id, total_amount, currency, status FROM invoices WHERE payment_id = $1",
      [paymentId],
    );
    return result.rows[0] === undefined ? null : this.toDomain(result.rows[0]);
  }

  async save(invoice: Invoice): Promise<void> {
    await this.database.query(
      `INSERT INTO invoices
         (id, order_id, payment_id, total_amount, currency, status)
       VALUES ($1, $2, $3, $4, $5, $6)
       ON CONFLICT (id) DO UPDATE SET
         order_id = EXCLUDED.order_id,
         payment_id = EXCLUDED.payment_id,
         total_amount = EXCLUDED.total_amount,
         currency = EXCLUDED.currency,
         status = EXCLUDED.status,
         updated_at = now()`,
      [
        invoice.id,
        invoice.orderId,
        invoice.paymentId,
        invoice.total.amount,
        invoice.total.currency,
        invoice.status,
      ],
    );
  }

  private toDomain(row: InvoiceRow): Invoice {
    return new Invoice({
      id: row.id as InvoiceId,
      orderId: row.order_id as OrderId,
      paymentId: row.payment_id as PaymentId,
      total: new Money(Number(row.total_amount), row.currency),
      status: row.status,
    });
  }
}
