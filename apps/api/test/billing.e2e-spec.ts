import type { INestApplication } from "@nestjs/common";
import { Test } from "@nestjs/testing";
import request from "supertest";

import { AppModule } from "../src/app.module";
import { DatabaseService } from "../src/database/database.service";

const customerId = "0198f5ef-b5bd-7c86-a7b2-bc32c5c57888";
const merchantId = "0198f5ef-b5bd-7c86-a7b2-bc32c5c57889";

describe("Billing REST API", () => {
  let app: INestApplication;
  let database: DatabaseService;

  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({ imports: [AppModule] }).compile();
    app = moduleRef.createNestApplication();
    await app.init();
    database = app.get(DatabaseService);
  });

  beforeEach(async () => {
    await database.query("TRUNCATE invoices, payments, order_items, orders CASCADE");
  });

  afterAll(async () => {
    await app.close();
  });

  it("executes Order -> Payment -> Invoice through HTTP", async () => {
    const orderResponse = await request(app.getHttpServer())
      .post("/orders")
      .send(validOrderBody())
      .expect(201);
    expect(orderResponse.body).toMatchObject({
      status: "PENDING_PAYMENT",
      total: { amount: 3_500, currency: "ARS" },
    });

    const paymentResponse = await request(app.getHttpServer())
      .post(`/orders/${orderResponse.body.orderId as string}/payments`)
      .expect(201);
    expect(paymentResponse.body).toMatchObject({
      orderId: orderResponse.body.orderId,
      status: "AUTHORIZED",
      amount: { amount: 3_500, currency: "ARS" },
    });

    const invoiceResponse = await request(app.getHttpServer())
      .post(`/orders/${orderResponse.body.orderId as string}/invoices`)
      .send({ paymentId: paymentResponse.body.paymentId })
      .expect(201);
    expect(invoiceResponse.body).toMatchObject({
      orderId: orderResponse.body.orderId,
      paymentId: paymentResponse.body.paymentId,
      status: "ISSUED",
      total: { amount: 3_500, currency: "ARS" },
    });

    const getResponse = await request(app.getHttpServer())
      .get(`/invoices/${invoiceResponse.body.invoiceId as string}`)
      .expect(200);
    expect(getResponse.body).toEqual(invoiceResponse.body);
  });

  it("returns the consistent validation envelope for invalid input", async () => {
    const response = await request(app.getHttpServer())
      .post("/orders")
      .send({ ...validOrderBody(), items: [] })
      .expect(400);

    expect(response.body).toMatchObject({
      statusCode: 400,
      error: { code: "VALIDATION_ERROR" },
    });
    expect(response.body.error.details).toEqual(expect.any(Array));
  });

  it("rejects malformed resource IDs before querying PostgreSQL", async () => {
    const response = await request(app.getHttpServer())
      .get("/invoices/not-a-uuid")
      .expect(400);

    expect(response.body.error.code).toBe("VALIDATION_ERROR");
  });

  it("maps a missing invoice to its typed HTTP error", async () => {
    const response = await request(app.getHttpServer())
      .get("/invoices/0198f5ef-b5bd-7c86-a7b2-bc32c5c57890")
      .expect(404);

    expect(response.body).toMatchObject({
      statusCode: 404,
      error: { code: "INVOICE_NOT_FOUND" },
    });
  });

  it("rejects invoice creation for a payment in an invalid state", async () => {
    const orderResponse = await request(app.getHttpServer())
      .post("/orders")
      .send(validOrderBody())
      .expect(201);
    const pendingPaymentId = "0198f5ef-b5bd-7c86-a7b2-bc32c5c57891";
    await database.query(
      `INSERT INTO payments (id, order_id, amount, currency, status)
       VALUES ($1, $2, $3, $4, 'PENDING')`,
      [pendingPaymentId, orderResponse.body.orderId, 3_500, "ARS"],
    );

    const response = await request(app.getHttpServer())
      .post(`/orders/${orderResponse.body.orderId as string}/invoices`)
      .send({ paymentId: pendingPaymentId })
      .expect(409);

    expect(response.body.error.code).toBe("PAYMENT_NOT_AUTHORIZED");
  });
});

function validOrderBody() {
  return {
    customerId,
    merchantId,
    deliveryAddress: "Av. Siempre Viva 742",
    items: [
      { productId: "product-1", quantity: 2, unitPrice: { amount: 1_500, currency: "ARS" } },
      { productId: "product-2", quantity: 1, unitPrice: { amount: 500, currency: "ARS" } },
    ],
  };
}
