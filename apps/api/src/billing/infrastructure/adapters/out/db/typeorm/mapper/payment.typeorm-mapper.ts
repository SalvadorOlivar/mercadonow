import { PAYMENT_STATUSES } from "@mercadonow/shared";

import { Payment } from "../../../../../../domain/entities/payment.entity";
import { Money } from "../../../../../../domain/value-objects/money";
import { PaymentTypeOrmEntity } from "../entity/payment.typeorm-entity";
import {
  mapPersistedAggregate,
  toAllowedString,
  toCurrency,
  toOptionalNonBlankText,
  toSafeCents,
  toUuidV7Id,
} from "./typeorm-persistence.mapper";

export class PaymentTypeOrmMapper {
  static toDomain(entity: PaymentTypeOrmEntity): Payment {
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

  static toPersistence(payment: Payment): PaymentTypeOrmEntity {
    return Object.assign(new PaymentTypeOrmEntity(), {
      id: payment.id,
      orderId: payment.orderId,
      amount: String(payment.amount.amount),
      currency: payment.amount.currency,
      status: payment.status,
      providerReference: payment.providerReference ?? null,
    });
  }
}
