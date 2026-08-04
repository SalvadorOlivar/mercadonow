/**
 * @mercadonow/shared — contracts shared between apps/api and apps/web.
 *
 * Only DTOs, status unions, and branded primitives live here.
 * NEVER put NestJS or React types here. This package is pure TypeScript
 * so both runtimes can import it without pulling framework dependencies.
 */

export * from "./money";
export * from "./status";
export * from "./ids";