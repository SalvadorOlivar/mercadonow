export const TRANSACTION_MANAGER = Symbol("TRANSACTION_MANAGER");

export interface TransactionManager {
  run<T>(work: () => Promise<T>): Promise<T>;
}

