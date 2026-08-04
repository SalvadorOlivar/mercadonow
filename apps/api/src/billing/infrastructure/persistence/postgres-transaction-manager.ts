import { Injectable } from "@nestjs/common";

import type { TransactionManager } from "../../application/ports/transaction-manager";
import { DatabaseService } from "../../../database/database.service";

@Injectable()
export class PostgresTransactionManager implements TransactionManager {
  constructor(private readonly database: DatabaseService) {}

  run<T>(work: () => Promise<T>): Promise<T> {
    return this.database.withTransaction(work);
  }
}
