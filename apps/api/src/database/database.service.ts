import {
  Inject,
  Injectable,
  OnApplicationBootstrap,
  OnApplicationShutdown,
} from "@nestjs/common";
import type { Pool, PoolClient, QueryResult, QueryResultRow } from "pg";

import { POSTGRES_POOL } from "./database.constants";

@Injectable()
export class DatabaseService
  implements OnApplicationBootstrap, OnApplicationShutdown
{
  private readonly transactionContext = new AsyncLocalStorage<PoolClient>();

  constructor(@Inject(POSTGRES_POOL) private readonly pool: Pool) {}

  async onApplicationBootstrap(): Promise<void> {
    await this.pool.query("SELECT 1");
  }

  async onApplicationShutdown(): Promise<void> {
    await this.pool.end();
  }

  query<T extends QueryResultRow>(
    text: string,
    values: readonly unknown[] = [],
  ): Promise<QueryResult<T>> {
    const executor = this.transactionContext.getStore() ?? this.pool;
    return executor.query<T>(text, [...values]);
  }

  async withTransaction<T>(work: () => Promise<T>): Promise<T> {
    if (this.transactionContext.getStore() !== undefined) {
      return work();
    }

    const client = await this.pool.connect();
    try {
      await client.query("BEGIN");
      const result = await this.transactionContext.run(client, work);
      await client.query("COMMIT");
      return result;
    } catch (error) {
      await client.query("ROLLBACK");
      throw error;
    } finally {
      client.release();
    }
  }
}
import { AsyncLocalStorage } from "node:async_hooks";

