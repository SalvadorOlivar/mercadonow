import { BadRequestException } from "@nestjs/common";
import type { ValidationIssue } from "@mercadonow/shared";

export class RequestValidationException extends BadRequestException {
  constructor(readonly issues: readonly ValidationIssue[]) {
    super("Request validation failed");
  }
}
