import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpException,
  HttpStatus,
} from "@nestjs/common";
import type { Response } from "express";

interface CodedError extends Error {
  readonly code: string;
}

const ERROR_STATUS: Readonly<Record<string, number>> = {
  DOMAIN_VALIDATION_ERROR: HttpStatus.BAD_REQUEST,
  INVALID_STATE_TRANSITION: HttpStatus.CONFLICT,
  ORDER_NOT_FOUND: HttpStatus.NOT_FOUND,
  PAYMENT_NOT_FOUND: HttpStatus.NOT_FOUND,
  INVOICE_NOT_FOUND: HttpStatus.NOT_FOUND,
  PAYMENT_NOT_AUTHORIZED: HttpStatus.CONFLICT,
  PAYMENT_ORDER_MISMATCH: HttpStatus.CONFLICT,
  INVOICE_ALREADY_EXISTS: HttpStatus.CONFLICT,
};

@Catch()
export class BillingExceptionFilter implements ExceptionFilter {
  catch(exception: unknown, host: ArgumentsHost): void {
    const response = host.switchToHttp().getResponse<Response>();
    const codedError = this.asCodedError(exception);
    if (codedError !== null) {
      const status = ERROR_STATUS[codedError.code];
      if (status === undefined) {
        response.status(HttpStatus.INTERNAL_SERVER_ERROR).json({
          statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
          error: { code: "INTERNAL_ERROR", message: "Internal server error" },
        });
        return;
      }
      response.status(status).json({
        statusCode: status,
        error: { code: codedError.code, message: codedError.message },
      });
      return;
    }

    if (exception instanceof HttpException) {
      const status = exception.getStatus();
      const exceptionResponse = exception.getResponse();
      const details =
        typeof exceptionResponse === "object" && exceptionResponse !== null
          ? (exceptionResponse as { message?: unknown }).message
          : undefined;
      response.status(status).json({
        statusCode: status,
        error: {
          code: status === HttpStatus.BAD_REQUEST ? "VALIDATION_ERROR" : "HTTP_ERROR",
          message: exception.message,
          ...(details === undefined ? {} : { details }),
        },
      });
      return;
    }

    response.status(HttpStatus.INTERNAL_SERVER_ERROR).json({
      statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
      error: { code: "INTERNAL_ERROR", message: "Internal server error" },
    });
  }

  private asCodedError(exception: unknown): CodedError | null {
    if (!(exception instanceof Error) || !("code" in exception)) return null;
    return typeof exception.code === "string" ? (exception as CodedError) : null;
  }
}
