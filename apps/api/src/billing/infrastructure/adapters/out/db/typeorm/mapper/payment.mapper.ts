import { PAYMENT_STATUSES } from "@mercadonow/shared";

import { Payment } from "../../../../../../domain/payment";
import { Money } from "../../../../../../domain/value-objects/money";
import { PaymentEntity } from "../entity/payment.entity";
import {
  mapPersistedAggregate,
  toAllowedString,
  toCurrency,
  toOptionalNonBlankText,
  toSafeCents,
  toUuidV7Id,
} from "./persistence.mapper";

export class PaymentMapper {
  static toDomain(entity: PaymentEntity): Payment {
    return mapPersistedAggregate("payments", () =>
      Payment.rehydrate({
        id: toUuidV7Id(entity.id, "PaymentId", "payments", "id"),
        orderId: toUuidV7Id(
          entity.orderId,
          "OrderId",
          "payments",
          "order_id",
        ),
        amount: new Money(
          toSafeCents(entity.amount, "payments", "amount"),
          toCurrency(entity.currency, "payments", "currency"),
        ),
        status: toAllowedString(
          entity.status,
          PAYMENT_STATUSES,
          "payments",
          "status",
        ),
        providerReference: toOptionalNonBlankText(
          entity.providerReference,
          "payments",
          "provider_reference",
        ),
      }),
    );
  }

  static toPersistence(payment: Payment): PaymentEntity {
    return Object.assign(new PaymentEntity(), {
      id: payment.id,
      orderId: payment.orderId,
      amount: String(payment.amount.amount),
      currency: payment.amount.currency,
      status: payment.status,
      providerReference: payment.providerReference ?? null,
    });
  }
}
