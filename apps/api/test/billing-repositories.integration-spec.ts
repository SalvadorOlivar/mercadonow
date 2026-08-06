import { asId } from "@mercadonow/shared";
import type { DataSource } from "typeorm";

import type { PaymentGateway } from "../src/billing/application/ports/out/payment-gateway";
import type { PaymentIdGenerator } from "../src/billing/application/ports/out/payment-id-generator";
import { CreateInvoice } from "../src/billing/application/use-cases/create-invoice.use-case";
import { CreatePayment } from "../src/billing/application/use-cases/create-payment.use-case";
import { Invoice } from "../src/billing/domain/invoice";
import { InvoiceAlreadyExistsError } from "../src/billing/application/errors/billing-application.errors";
import { Order } from "../src/billing/domain/order";
import { Payment } from "../src/billing/domain/payment";
import { Money } from "../src/billing/domain/value-objects/money";
import { PersistenceMappingError } from "../src/billing/infrastructure/adapters/out/db/typeorm/mapper/persistence-mapping.error";
import { InvoiceRepository } from "../src/billing/infrastructure/adapters/out/db/typeorm/repository/invoice.repository";
import { OrderRepository } from "../src/billing/infrastructure/adapters/out/db/typeorm/repository/order.repository";
import { PaymentRepository } from "../src/billing/infrastructure/adapters/out/db/typeorm/repository/payment.repository";
import { EntityManagerContext } from "../src/billing/infrastructure/adapters/out/db/typeorm/entity-manager.context";
import { TransactionManager } from "../src/billing/infrastructure/adapters/out/db/typeorm/transaction.manager";
import { createPostgresqlDataSource } from "../src/config/database/postgresql/postgresql-data.source";

const orderId = asId("0198f5ef-b5bd-7c86-a7b2-bc32c5c57888", "OrderId");
const paymentId = asId("0198f5ef-b5bd-7c86-a7b2-bc32c5c57889", "PaymentId");
const invoiceId = asId("0198f5ef-b5bd-7c86-a7b2-bc32c5c57890", "InvoiceId");

describe("TypeORM billing repositories", () => {
  let dataSource: DataSource;
  let orders: OrderRepository;
  let payments: PaymentRepository;
  let invoices: InvoiceRepository;
  let transactions: TransactionManager;

  beforeAll(async () => {
    dataSource = createPostgresqlDataSource(process.env.DATABASE_URL ?? "");
    await dataSource.initialize();
    const context = new EntityManagerContext(dataSource);
    orders = new OrderRepository(context);
    payments = new PaymentRepository(context);
    invoices = new InvoiceRepository(context);
    transactions = new TransactionManager(dataSource, context);
  });

  beforeEach(async () => {
    await dataSource.query("TRUNCATE invoices, payments, order_items, orders CASCADE");
  });

  afterAll(async () => {
    await dataSource.destroy();
  });

  it("round-trips the complete billing aggregate data", async () => {
    const order = makeOrder();
    const payment = Payment.create({
      id: paymentId,
      orderId,
      amount: order.total,
    });
    payment.authorize("provider-integration");
    order.markPaid();
    const invoice = Invoice.create({
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

    const persistedOrder = await orders.findById(orderId);
    expect(persistedOrder).toMatchObject({
      id: orderId,
      status: "PAID",
      deliveryAddress: "Integration address",
    });
    expect(persistedOrder?.items.map((item) => item.productId)).toEqual([
      "product-1",
      "product-2",
    ]);
    expect((await payments.findByOrderId(orderId))[0]).toMatchObject({
      id: paymentId,
      status: "AUTHORIZED",
      providerReference: "provider-integration",
    });
    expect(await payments.findById(paymentId)).toMatchObject({
      orderId,
      status: "AUTHORIZED",
    });
    expect(await invoices.findByPaymentId(paymentId)).toMatchObject({
      id: invoiceId,
      status: "ISSUED",
    });
    expect(await invoices.findById(invoiceId)).toMatchObject({ orderId });
    expect(await invoices.findByOrderId(orderId)).toMatchObject({ id: invoiceId });
  });

  it("updates and rehydrates aggregate state without replaying transitions", async () => {
    const order = makeOrder();
    const payment = Payment.create({ id: paymentId, orderId, amount: order.total });
    const invoice = Invoice.create({
      id: invoiceId,
      orderId,
      paymentId,
      total: payment.amount,
    });

    await transactions.run(async () => {
      await orders.save(order);
      await payments.save(payment);
      await invoices.save(invoice);
    });

    order.markPaid();
    payment.authorize("provider-update");
    invoice.issue();
    await transactions.run(async () => {
      await orders.save(order);
      await payments.save(payment);
      await invoices.save(invoice);
    });

    expect(await orders.findById(orderId)).toMatchObject({ status: "PAID" });
    expect(await payments.findById(paymentId)).toMatchObject({
      status: "AUTHORIZED",
      providerReference: "provider-update",
    });
    expect(await invoices.findById(invoiceId)).toMatchObject({
      status: "ISSUED",
    });
  });

  it("returns null when aggregates do not exist", async () => {
    expect(await orders.findById(orderId)).toBeNull();
    expect(await payments.findById(paymentId)).toBeNull();
    expect(await payments.findByOrderId(orderId)).toEqual([]);
    expect(await invoices.findById(invoiceId)).toBeNull();
    expect(await invoices.findByOrderId(orderId)).toBeNull();
    expect(await invoices.findByPaymentId(paymentId)).toBeNull();
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
    const payment = Payment.create({ id: paymentId, orderId, amount: order.total });
    payment.authorize("provider-integration");
    await orders.save(order);
    await payments.save(payment);
    await invoices.save(
      Invoice.create({ id: invoiceId, orderId, paymentId, total: payment.amount }),
    );

    await expect(
      invoices.save(
        Invoice.create({
          id: asId("0198f5ef-b5bd-7c86-a7b2-bc32c5c57891", "InvoiceId"),
          orderId,
          paymentId,
          total: payment.amount,
        }),
      ),
    ).rejects.toBeInstanceOf(InvoiceAlreadyExistsError);
  });

  it("concurrent invoice requests return one stable invoice", async () => {
    const order = makeOrder();
    const payment = Payment.create({ id: paymentId, orderId, amount: order.total });
    payment.authorize("provider-concurrent-invoice");
    await orders.save(order);
    await payments.save(payment);

    const first = new CreateInvoice(
      orders,
      payments,
      invoices,
      transactions,
      { generate: () => invoiceId },
    );
    const secondInvoiceId = asId(
      "0198f5ef-b5bd-7c86-a7b2-bc32c5c57891",
      "InvoiceId",
    );
    const second = new CreateInvoice(
      orders,
      payments,
      invoices,
      transactions,
      { generate: () => secondInvoiceId },
    );

    const results = await Promise.all([
      first.execute({ orderId, paymentId }),
      second.execute({ orderId, paymentId }),
    ]);

    expect(results[0]).toEqual(results[1]);
    const count = await dataSource.query<Array<{ count: string }>>(
      "SELECT count(*) FROM invoices WHERE payment_id = $1",
      [paymentId],
    );
    expect(count[0]?.count).toBe("1");
  });

  it("concurrent payment requests share one logical gateway charge", async () => {
    await orders.save(makeOrder());
    const firstPaymentId = paymentId;
    const secondPaymentId = asId(
      "0198f5ef-b5bd-7c86-a7b2-bc32c5c57894",
      "PaymentId",
    );
    const gatewayPaymentIds: string[] = [];
    const gateway: PaymentGateway = {
      authorize: async (input) => {
        gatewayPaymentIds.push(input.paymentId);
        await new Promise((resolve) => setTimeout(resolve, 25));
        return {
          authorized: true,
          providerReference: `provider-${input.paymentId}`,
        };
      },
    };
    const makeUseCase = (ids: PaymentIdGenerator) =>
      new CreatePayment(orders, payments, transactions, ids, gateway);

    const results = await Promise.all([
      makeUseCase({ generate: () => firstPaymentId }).execute({ orderId }),
      makeUseCase({ generate: () => secondPaymentId }).execute({ orderId }),
    ]);

    expect(results[0]).toEqual(results[1]);
    expect(new Set(gatewayPaymentIds).size).toBe(1);
    const activePayments = await dataSource.query<Array<{ count: string }>>(
      `SELECT count(*) FROM payments
         WHERE order_id = $1 AND status IN ('PENDING', 'AUTHORIZED')`,
      [orderId],
    );
    expect(activePayments[0]?.count).toBe("1");
  });

  it("rejects an order whose stored total disagrees with its items", async () => {
    await orders.save(makeOrder());
    await dataSource.query("UPDATE orders SET total_amount = 1 WHERE id = $1", [
      orderId,
    ]);

    await expect(orders.findById(orderId)).rejects.toMatchObject({
      code: "PERSISTENCE_MAPPING_ERROR",
      source: "orders",
      field: "total_amount",
    });
  });

  it("distinguishes a corrupted order without items from a missing order", async () => {
    await dataSource.query(
      `INSERT INTO orders
         (id, customer_id, merchant_id, delivery_address, status,
          total_amount, currency)
       VALUES ($1, $2, $3, 'Missing items', 'PENDING_PAYMENT', 0, 'ARS')`,
      [
        orderId,
        asId("0198f5ef-b5bd-7c86-a7b2-bc32c5c57892", "CustomerId"),
        asId("0198f5ef-b5bd-7c86-a7b2-bc32c5c57893", "MerchantId"),
      ],
    );

    await expect(orders.findById(orderId)).rejects.toMatchObject({
      code: "PERSISTENCE_MAPPING_ERROR",
      source: "order_items",
      field: "product_id",
    });
  });

  it("rejects persisted money outside the JavaScript safe integer range", async () => {
    await dataSource.query(
      `INSERT INTO orders
         (id, customer_id, merchant_id, delivery_address, status,
          total_amount, currency)
       VALUES ($1, $2, $3, 'Unsafe amount', 'PENDING_PAYMENT', $4, 'ARS')`,
      [
        orderId,
        asId("0198f5ef-b5bd-7c86-a7b2-bc32c5c57892", "CustomerId"),
        asId("0198f5ef-b5bd-7c86-a7b2-bc32c5c57893", "MerchantId"),
        "9007199254740992",
      ],
    );
    await dataSource.query(
      `INSERT INTO order_items
         (order_id, position, product_id, quantity, unit_price_amount, currency)
       VALUES ($1, 0, 'product-unsafe', 1, $2, 'ARS')`,
      [orderId, "9007199254740992"],
    );

    await expect(orders.findById(orderId)).rejects.toBeInstanceOf(
      PersistenceMappingError,
    );
  });

  it("wraps invalid persisted aggregate state with repository context", async () => {
    await orders.save(makeOrder());
    await dataSource.query(
      `INSERT INTO payments
         (id, order_id, amount, currency, status, provider_reference)
       VALUES ($1, $2, 3000, 'ARS', 'AUTHORIZED', NULL)`,
      [paymentId, orderId],
    );

    await expect(payments.findById(paymentId)).rejects.toMatchObject({
      code: "PERSISTENCE_MAPPING_ERROR",
      source: "payments",
      field: "aggregate",
    });
  });
});

function makeOrder(): Order {
  return Order.create({
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
