import { INVOICE_STATUSES } from "@mercadonow/shared";

import { Invoice } from "../../../../../../domain/invoice";
import { Money } from "../../../../../../domain/value-objects/money";
import { InvoiceEntity } from "../entity/invoice.entity";
import {
  mapPersistedAggregate,
  toAllowedString,
  toCurrency,
  toSafeCents,
  toUuidV7Id,
} from "./persistence.mapper";

export class InvoiceMapper {
  static toDomain(entity: InvoiceEntity): Invoice {
    return mapPersistedAggregate("invoices", () =>
      Invoice.rehydrate({
        id: toUuidV7Id(entity.id, "InvoiceId", "invoices", "id"),
        orderId: toUuidV7Id(
          entity.orderId,
          "OrderId",
          "invoices",
          "order_id",
        ),
        paymentId: toUuidV7Id(
          entity.paymentId,
          "PaymentId",
          "invoices",
          "payment_id",
        ),
        total: new Money(
          toSafeCents(entity.totalAmount, "invoices", "total_amount"),
          toCurrency(entity.currency, "invoices", "currency"),
        ),
        status: toAllowedString(
          entity.status,
          INVOICE_STATUSES,
          "invoices",
          "status",
        ),
      }),
    );
  }

  static toPersistence(invoice: Invoice): InvoiceEntity {
    return Object.assign(new InvoiceEntity(), {
      id: invoice.id,
      orderId: invoice.orderId,
      paymentId: invoice.paymentId,
      totalAmount: String(invoice.total.amount),
      currency: invoice.total.currency,
      status: invoice.status,
    });
  }
}
