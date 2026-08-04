import { asId } from "@mercadonow/shared";
import { Pool } from "pg";

import { Invoice } from "../src/billing/domain/entities/invoice.entity";
import { Order } from "../src/billing/domain/entities/order.entity";
import { Payment } from "../src/billing/domain/entities/payment.entity";
import { Money } from "../src/billing/domain/value-objects/money";
import { PostgresInvoiceRepository } from "../src/billing/infrastructure/persistence/postgres-invoice.repository";
import { PostgresOrderRepository } from "../src/billing/infrastructure/persistence/postgres-order.repository";
import { PostgresPaymentRepository } from "../src/billing/infrastructure/persistence/postgres-payment.repository";
import { PostgresTransactionManager } from "../src/billing/infrastructure/persistence/postgres-transaction-manager";
import { DatabaseService } from "../src/database/database.service";

const orderId = asId("0198f5ef-b5bd-7c86-a7b2-bc32c5c57888", "OrderId");
const paymentId = asId("0198f5ef-b5bd-7c86-a7b2-bc32c5c57889", "PaymentId");
const invoiceId = asId("0198f5ef-b5bd-7c86-a7b2-bc32c5c57890", "InvoiceId");

describe("PostgreSQL billing repositories", () => {
  let database: DatabaseService;
  let orders: PostgresOrderRepository;
  let payments: PostgresPaymentRepository;
  let invoices: PostgresInvoiceRepository;
  let transactions: PostgresTransactionManager;

  beforeAll(async () => {
    const pool = new Pool({ connectionString: process.env.DATABASE_URL });
    database = new DatabaseService(pool);
    await database.onApplicationBootstrap();
    orders = new PostgresOrderRepository(database);
    payments = new PostgresPaymentRepository(database);
    invoices = new PostgresInvoiceRepository(database);
    transactions = new PostgresTransactionManager(database);
  });

  beforeEach(async () => {
    await database.query("TRUNCATE invoices, payments, order_items, orders CASCADE");
  });

  afterAll(async () => {
    await database.onApplicationShutdown();
  });

  it("round-trips the complete billing aggregate data", async () => {
    const order = makeOrder();
    const payment = new Payment({
      id: paymentId,
      orderId,
      amount: order.total,
    });
    payment.authorize("provider-integration");
    order.markPaid();
    const invoice = new Invoice({
      id: invoiceId,
      orderId,
      paymentId,
      total: payment.amount,
    });
    invoice.issue();

    await transactions.run(async () => {
      await orders.save(order);
      await payments.save(payment);
      await invoices.save(invoice);
    });

    expect(await orders.findById(orderId)).toMatchObject({
      id: orderId,
      status: "PAID",
      deliveryAddress: "Integration address",
    });
    expect((await payments.findByOrderId(orderId))[0]).toMatchObject({
      id: paymentId,
      status: "AUTHORIZED",
      providerReference: "provider-integration",
    });
    expect(await invoices.findByPaymentId(paymentId)).toMatchObject({
      id: invoiceId,
      status: "ISSUED",
    });
  });

  it("rolls back all repository writes when the application transaction fails", async () => {
    await expect(
      transactions.run(async () => {
        await orders.save(makeOrder());
        throw new Error("force rollback");
      }),
    ).rejects.toThrow("force rollback");

    expect(await orders.findById(orderId)).toBeNull();
  });

  it("enforces one invoice per payment at the database boundary", async () => {
    const order = makeOrder();
    const payment = new Payment({ id: paymentId, orderId, amount: order.total });
    payment.authorize("provider-integration");
    await orders.save(order);
    await payments.save(payment);
    await invoices.save(
      new Invoice({ id: invoiceId, orderId, paymentId, total: payment.amount }),
    );

    await expect(
      invoices.save(
        new Invoice({
          id: asId("0198f5ef-b5bd-7c86-a7b2-bc32c5c57891", "InvoiceId"),
          orderId,
          paymentId,
          total: payment.amount,
        }),
      ),
    ).rejects.toMatchObject({ code: "23505" });
  });
});

function makeOrder(): Order {
  return new Order({
    id: orderId,
    customerId: asId("0198f5ef-b5bd-7c86-a7b2-bc32c5c57892", "CustomerId"),
    merchantId: asId("0198f5ef-b5bd-7c86-a7b2-bc32c5c57893", "MerchantId"),
    deliveryAddress: "Integration address",
    items: [
      { productId: "product-1", quantity: 2, unitPrice: new Money(1_250, "ARS") },
      { productId: "product-2", quantity: 1, unitPrice: new Money(500, "ARS") },
    ],
  });
}
