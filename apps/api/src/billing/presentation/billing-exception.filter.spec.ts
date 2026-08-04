import { BadRequestException, type ArgumentsHost } from "@nestjs/common";

import { InvoiceNotFoundError } from "../application/errors/billing-application.errors";
import { asId } from "@mercadonow/shared";
import { BillingExceptionFilter } from "./billing-exception.filter";

const setup = () => {
  const response = {
    status: jest.fn(),
    json: jest.fn(),
  };
  response.status.mockReturnValue(response);
  const host = {
    switchToHttp: () => ({ getResponse: () => response }),
  } as unknown as ArgumentsHost;

  return { filter: new BillingExceptionFilter(), host, response };
};

describe("BillingExceptionFilter", () => {
  it("maps typed application errors to the stable HTTP envelope", () => {
    const { filter, host, response } = setup();
    const id = asId("0198f5ef-b5bd-7c86-a7b2-bc32c5c57888", "InvoiceId");

    filter.catch(new InvoiceNotFoundError(id), host);

    expect(response.status).toHaveBeenCalledWith(404);
    expect(response.json).toHaveBeenCalledWith({
      statusCode: 404,
      error: {
        code: "INVOICE_NOT_FOUND",
        message: `Invoice ${id} was not found`,
      },
    });
  });

  it("normalizes validation exceptions", () => {
    const { filter, host, response } = setup();

    filter.catch(new BadRequestException(["items must contain at least 1 elements"]), host);

    expect(response.status).toHaveBeenCalledWith(400);
    expect(response.json).toHaveBeenCalledWith(
      expect.objectContaining({
        statusCode: 400,
        error: expect.objectContaining({ code: "VALIDATION_ERROR" }),
      }),
    );
  });

  it("does not expose messages from unknown infrastructure errors", () => {
    const { filter, host, response } = setup();
    const error = Object.assign(new Error("sensitive database details"), {
      code: "23505",
    });

    filter.catch(error, host);

    expect(response.status).toHaveBeenCalledWith(500);
    expect(response.json).toHaveBeenCalledWith({
      statusCode: 500,
      error: { code: "INTERNAL_ERROR", message: "Internal server error" },
    });
  });
});
