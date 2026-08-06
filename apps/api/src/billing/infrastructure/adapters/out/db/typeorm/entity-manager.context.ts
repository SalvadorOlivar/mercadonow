import { AsyncLocalStorage } from "node:async_hooks";

import { Injectable } from "@nestjs/common";
import type { EntityManager } from "typeorm";
import { DataSource } from "typeorm";

@Injectable()
export class EntityManagerContext {
  private readonly storage = new AsyncLocalStorage<EntityManager>();

  constructor(private readonly dataSource: DataSource) {}

  get current(): EntityManager {
    return this.storage.getStore() ?? this.dataSource.manager;
  }

  get hasActiveTransaction(): boolean {
    return this.storage.getStore() !== undefined;
  }

  run<T>(manager: EntityManager, work: () => Promise<T>): Promise<T> {
    return this.storage.run(manager, work);
  }
}
