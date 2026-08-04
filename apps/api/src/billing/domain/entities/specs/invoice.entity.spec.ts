import { asId } from "@mercadonow/shared";

import { InvalidStateTransitionError } from "../../errors/invalid-state-transition.error";
import { Money } from "../../value-objects/money";
import { Invoice } from "../invoice.entity";

const createInvoice = (): Invoice =>
  new Invoice({
    id: asId("0198-invoice", "InvoiceId"),
    orderId: asId("0198-order", "OrderId"),
    paymentId: asId("0198-payment", "PaymentId"),
    total: new Money(3_500, "ARS"),
  });

describe("Invoice", () => {
  it("references aggregates by ID and starts as a draft", () => {
    const invoice = createInvoice();

    expect(invoice.orderId).toBe("0198-order");
    expect(invoice.paymentId).toBe("0198-payment");
    expect(invoice.status).toBe("DRAFT");
  });

  it("can be issued and marked as paid", () => {
    const invoice = createInvoice();

    invoice.issue();
    invoice.markPaid();

    expect(invoice.status).toBe("PAID");
  });

  it("cannot mark a draft as paid", () => {
    expect(() => createInvoice().markPaid()).toThrow(
      InvalidStateTransitionError,
    );
  });
});
