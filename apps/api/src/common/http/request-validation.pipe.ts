import { ValidationPipe } from "@nestjs/common";
import type { ValidationError } from "class-validator";
import type { ValidationIssue } from "@mercadonow/shared";

import { RequestValidationException } from "./request-validation.exception";

export function createRequestValidationPipe(): ValidationPipe {
  return new ValidationPipe({
    transform: true,
    whitelist: true,
    forbidNonWhitelisted: true,
    validationError: { target: false, value: false },
    exceptionFactory: (errors) =>
      new RequestValidationException(flattenValidationErrors(errors)),
  });
}

export function flattenValidationErrors(
  errors: readonly ValidationError[],
): readonly ValidationIssue[] {
  return errors.flatMap((error) => flattenValidationError(error, ""));
}

function flattenValidationError(
  error: ValidationError,
  parentPath: string,
): readonly ValidationIssue[] {
  const path = parentPath.length === 0
    ? error.property
    : `${parentPath}.${error.property}`;
  const messages = Object.values(error.constraints ?? {}).sort();
  const ownIssue = messages.length === 0 ? [] : [{ path, messages }];
  const childIssues = (error.children ?? []).flatMap((child) =>
    flattenValidationError(child, path),
  );

  return [...ownIssue, ...childIssues];
}
