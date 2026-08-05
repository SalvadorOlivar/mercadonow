import { Injectable } from "@nestjs/common";
import { DataSource } from "typeorm";

import type { TransactionManager } from "../../../../../application/ports/transaction-manager";
import { TypeOrmEntityManagerContext } from "./typeorm-entity-manager.context";

@Injectable()
export class TypeOrmTransactionManager implements TransactionManager {
  constructor(
    private readonly dataSource: DataSource,
    private readonly context: TypeOrmEntityManagerContext,
  ) {}

  run<T>(work: () => Promise<T>): Promise<T> {
    if (this.context.hasActiveTransaction) return work();
    return this.dataSource.transaction((manager) =>
      this.context.run(manager, work),
    );
  }
}
