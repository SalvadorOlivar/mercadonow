export const TRANSACTION_MANAGER = Symbol("TRANSACTION_MANAGER");

/**
 * Runs an application operation atomically across outbound persistence ports.
 * The implementation decides how the transaction context is propagated.
 */
export interface TransactionManager {
  run<T>(work: () => Promise<T>): Promise<T>;
}
