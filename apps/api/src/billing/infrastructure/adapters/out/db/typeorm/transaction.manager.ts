import { Injectable } from "@nestjs/common";
import { DataSource } from "typeorm";

import type { TransactionManagerPort } from "../../../../../application/ports/out/transaction-manager";
import { EntityManagerContext } from "./entity-manager.context";

@Injectable()
export class TransactionManager implements TransactionManagerPort {
  constructor(
    private readonly dataSource: DataSource,
    private readonly context: EntityManagerContext,
  ) {}

  run<T>(work: () => Promise<T>): Promise<T> {
    if (this.context.hasActiveTransaction) return work();
    return this.dataSource.transaction((manager) =>
      this.context.run(manager, work),
    );
  }
}
