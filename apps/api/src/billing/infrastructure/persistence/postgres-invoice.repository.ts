import { Injectable } from "@nestjs/common";
import type {
  InvoiceId,
  OrderId,
  PaymentId,
} from "@mercadonow/shared";
import { INVOICE_STATUSES } from "@mercadonow/shared";

import { DatabaseService } from "../../../database/database.service";
import { Invoice } from "../../domain/entities/invoice.entity";
import type { InvoiceRepository } from "../../domain/repositories/invoice.repository";
import { Money } from "../../domain/value-objects/money";
import {
  mapPersistedAggregate,
  toAllowedString,
  toCurrency,
  toSafeCents,
  toUuidV7Id,
} from "./postgres-row.mapper";

interface InvoiceRow {
  readonly id: unknown;
  readonly order_id: unknown;
  readonly payment_id: unknown;
  readonly total_amount: unknown;
  readonly currency: unknown;
  readonly status: unknown;
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
    return mapPersistedAggregate("invoices", () =>
      Invoice.rehydrate({
        id: toUuidV7Id(row.id, "InvoiceId", "invoices", "id"),
        orderId: toUuidV7Id(
          row.order_id,
          "OrderId",
          "invoices",
          "order_id",
        ),
        paymentId: toUuidV7Id(
          row.payment_id,
          "PaymentId",
          "invoices",
          "payment_id",
        ),
        total: new Money(
          toSafeCents(
            row.total_amount,
            "invoices",
            "total_amount",
          ),
          toCurrency(row.currency, "invoices", "currency"),
        ),
        status: toAllowedString(
          row.status,
          INVOICE_STATUSES,
          "invoices",
          "status",
        ),
      }),
    );
  }
}
