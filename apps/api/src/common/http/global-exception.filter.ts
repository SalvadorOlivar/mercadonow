import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpException,
  HttpStatus,
  Logger,
} from "@nestjs/common";
import type { Request, Response } from "express";
import type {
  ApiErrorCode,
  ApiErrorResponse,
  ExpectedBillingErrorCode,
} from "@mercadonow/shared";

import { BillingError } from "../../billing/domain/errors/billing.error";
import { RequestValidationException } from "./request-validation.exception";

const ERROR_STATUS = {
  DOMAIN_VALIDATION_ERROR: HttpStatus.BAD_REQUEST,
  INVALID_STATE_TRANSITION: HttpStatus.CONFLICT,
  ORDER_NOT_FOUND: HttpStatus.NOT_FOUND,
  PAYMENT_NOT_FOUND: HttpStatus.NOT_FOUND,
  INVOICE_NOT_FOUND: HttpStatus.NOT_FOUND,
  PAYMENT_NOT_AUTHORIZED: HttpStatus.CONFLICT,
  PAYMENT_ORDER_MISMATCH: HttpStatus.CONFLICT,
  INVOICE_ALREADY_EXISTS: HttpStatus.CONFLICT,
} as const satisfies Record<ExpectedBillingErrorCode, number>;

@Catch()
export class GlobalExceptionFilter implements ExceptionFilter {
  private readonly logger = new Logger(GlobalExceptionFilter.name);

  catch(exception: unknown, host: ArgumentsHost): void {
    const http = host.switchToHttp();
    const response = http.getResponse<Response>();

    if (exception instanceof BillingError) {
      const status = ERROR_STATUS[exception.code];
      this.respond(response, status, exception.code, exception.message);
      return;
    }

    if (exception instanceof RequestValidationException) {
      this.respond(
        response,
        HttpStatus.BAD_REQUEST,
        "VALIDATION_ERROR",
        exception.message,
        exception.issues,
      );
      return;
    }

    if (exception instanceof HttpException) {
      if (exception.getStatus() >= HttpStatus.INTERNAL_SERVER_ERROR) {
        this.respondUnexpected(
          response,
          http.getRequest<Request>(),
          exception,
        );
        return;
      }
      this.respond(
        response,
        exception.getStatus(),
        "HTTP_ERROR",
        exception.message,
      );
      return;
    }

    this.respondUnexpected(response, http.getRequest<Request>(), exception);
  }

  private respondUnexpected(
    response: Response,
    request: Request,
    exception: unknown,
  ): void {
    const context = `${request.method ?? "UNKNOWN"} ${request.originalUrl ?? request.url ?? "UNKNOWN"}`;
    const stack = exception instanceof Error ? exception.stack : String(exception);
    this.logger.error(`Unhandled exception while processing ${context}`, stack);
    this.respond(
      response,
      HttpStatus.INTERNAL_SERVER_ERROR,
      "INTERNAL_ERROR",
      "Internal server error",
    );
  }

  private respond(
    response: Response,
    statusCode: number,
    code: ApiErrorCode,
    message: string,
    details?: ApiErrorResponse["error"]["details"],
  ): void {
    const body: ApiErrorResponse = {
      statusCode,
      error: {
        code,
        message,
        ...(details === undefined ? {} : { details }),
      },
    };
    response.status(statusCode).json(body);
  }
}
