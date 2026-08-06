import { QueryFailedError } from "typeorm";

export function isPostgresConstraintViolation(
  error: unknown,
  constraint: string,
): boolean {
  if (!(error instanceof QueryFailedError)) return false;
  const driverError = error.driverError as {
    code?: unknown;
    constraint?: unknown;
  };
  return driverError.code === "23505" && driverError.constraint === constraint;
}
