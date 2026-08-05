import {
  BadRequestException,
  InternalServerErrorException,
  Logger,
  type ArgumentsHost,
} from "@nestjs/common";
import { asId } from "@mercadonow/shared";

import {
  InvoiceAlreadyExistsError,
  InvoiceNotFoundError,
  OrderNotFoundError,
  PaymentNotAuthorizedError,
  PaymentNotFoundError,
  PaymentOrderMismatchError,
} from "../../billing/application/errors/billing-application.errors";
import { DomainValidationError } from "../../billing/domain/errors/domain-validation.error";
import { InvalidStateTransitionError } from "../../billing/domain/errors/invalid-state-transition.error";
import { GlobalExceptionFilter } from "./global-exception.filter";
import { RequestValidationException } from "./request-validation.exception";

const orderId = asId("0198f5ef-b5bd-7c86-a7b2-bc32c5c57881", "OrderId");
const paymentId = asId("0198f5ef-b5bd-7c86-a7b2-bc32c5c57882", "PaymentId");
const invoiceId = asId("0198f5ef-b5bd-7c86-a7b2-bc32c5c57883", "InvoiceId");

const expectedErrors = [
  [new DomainValidationError("invalid domain input"), 400, "DOMAIN_VALIDATION_ERROR"],
  [new InvalidStateTransitionError("Order", "PAID", "CANCELLED"), 409, "INVALID_STATE_TRANSITION"],
  [new OrderNotFoundError(orderId), 404, "ORDER_NOT_FOUND"],
  [new PaymentNotFoundError(paymentId), 404, "PAYMENT_NOT_FOUND"],
  [new InvoiceNotFoundError(invoiceId), 404, "INVOICE_NOT_FOUND"],
  [new PaymentNotAuthorizedError(paymentId), 409, "PAYMENT_NOT_AUTHORIZED"],
  [new PaymentOrderMismatchError(paymentId, orderId), 409, "PAYMENT_ORDER_MISMATCH"],
  [new InvoiceAlreadyExistsError(paymentId), 409, "INVOICE_ALREADY_EXISTS"],
] as const;

function setup() {
  const response = {
    status: jest.fn(),
    json: jest.fn(),
  };
  response.status.mockReturnValue(response);
  const request = { method: "GET", originalUrl: "/invoices/example" };
  const host = {
    switchToHttp: () => ({
      getResponse: () => response,
      getRequest: () => request,
    }),
  } as unknown as ArgumentsHost;

  return { filter: new GlobalExceptionFilter(), host, response };
}

describe("GlobalExceptionFilter", () => {
  it.each(expectedErrors)(
    "maps $2 for $0 to the stable envelope",
    (error, status, code) => {
      const { filter, host, response } = setup();

      filter.catch(error, host);

      expect(response.status).toHaveBeenCalledWith(status);
      expect(response.json).toHaveBeenCalledWith({
        statusCode: status,
        error: { code, message: error.message },
      });
    },
  );

  it("returns normalized validation issues", () => {
    const { filter, host, response } = setup();
    const issues = [{ path: "items.0.quantity", messages: ["quantity must be an integer number"] }];

    filter.catch(new RequestValidationException(issues), host);

    expect(response.json).toHaveBeenCalledWith({
      statusCode: 400,
      error: {
        code: "VALIDATION_ERROR",
        message: "Request validation failed",
        details: issues,
      },
    });
  });

  it("maps other framework exceptions without exposing their response body", () => {
    const { filter, host, response } = setup();

    filter.catch(new BadRequestException("Malformed JSON"), host);

    expect(response.json).toHaveBeenCalledWith({
      statusCode: 400,
      error: { code: "HTTP_ERROR", message: "Malformed JSON" },
    });
  });

  it("logs unknown failures and does not expose infrastructure details", () => {
    const logger = jest.spyOn(Logger.prototype, "error").mockImplementation();
    const { filter, host, response } = setup();
    const error = Object.assign(new Error("sensitive database details"), {
      code: "23505",
    });

    filter.catch(error, host);

    expect(logger).toHaveBeenCalledWith(
      "Unhandled exception while processing GET /invoices/example",
      error.stack,
    );
    expect(response.status).toHaveBeenCalledWith(500);
    expect(response.json).toHaveBeenCalledWith({
      statusCode: 500,
      error: { code: "INTERNAL_ERROR", message: "Internal server error" },
    });
    logger.mockRestore();
  });

  it("sanitizes and logs framework exceptions with a 5xx status", () => {
    const logger = jest.spyOn(Logger.prototype, "error").mockImplementation();
    const { filter, host, response } = setup();
    const error = new InternalServerErrorException("sensitive framework detail");

    filter.catch(error, host);

    expect(logger).toHaveBeenCalledWith(
      "Unhandled exception while processing GET /invoices/example",
      error.stack,
    );
    expect(response.json).toHaveBeenCalledWith({
      statusCode: 500,
      error: { code: "INTERNAL_ERROR", message: "Internal server error" },
    });
    logger.mockRestore();
  });
});
