import { asId } from "@mercadonow/shared";

import { Invoice } from "../../../domain/entities/invoice.entity";
import type { InvoiceRepository } from "../../../domain/repositories/invoice.repository";
import { Money } from "../../../domain/value-objects/money";
import { InvoiceNotFoundError } from "../../errors/billing-application.errors";
import { GetInvoice } from "../get-invoice.use-case";

const invoiceId = asId("0198f5ef-b5bd-7c86-a7b2-bc32c5c57888", "InvoiceId");
const orderId = asId("0198f5ef-b5bd-7c86-a7b2-bc32c5c57889", "OrderId");
const paymentId = asId("0198f5ef-b5bd-7c86-a7b2-bc32c5c57890", "PaymentId");

const repositoryWith = (invoice: Invoice | null): InvoiceRepository => ({
  findById: jest.fn().mockResolvedValue(invoice),
  findByOrderId: jest.fn().mockResolvedValue(null),
  findByPaymentId: jest.fn().mockResolvedValue(null),
  save: jest.fn().mockResolvedValue(undefined),
});

describe("GetInvoice", () => {
  it("returns a serializable output instead of the entity", async () => {
    const invoice = new Invoice({
      id: invoiceId,
      orderId,
      paymentId,
      total: new Money(2_000, "ARS"),
    });
    invoice.issue();
    const useCase = new GetInvoice(repositoryWith(invoice));

    const output = await useCase.execute({ invoiceId });

    expect(output).toEqual({
      invoiceId,
      orderId,
      paymentId,
      status: "ISSUED",
      total: { amount: 2_000, currency: "ARS" },
    });
    expect(output).not.toBe(invoice);
  });

  it("throws a typed error when the invoice does not exist", async () => {
    const useCase = new GetInvoice(repositoryWith(null));

    await expect(useCase.execute({ invoiceId })).rejects.toThrow(InvoiceNotFoundError);
  });
});
