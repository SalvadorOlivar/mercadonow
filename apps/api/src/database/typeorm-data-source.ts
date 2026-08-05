import { DataSource, type DataSourceOptions } from "typeorm";

import { BILLING_TYPEORM_ENTITIES } from "../billing/infrastructure/adapters/out/db/typeorm/entity";
import { CreateBillingTables1754352000000 } from "../billing/infrastructure/adapters/out/db/typeorm/migration/1754352000000-create-billing-tables";
import { OneActivePaymentPerOrder1754352001000 } from "../billing/infrastructure/adapters/out/db/typeorm/migration/1754352001000-one-active-payment-per-order";

export function createTypeOrmOptions(databaseUrl: string): DataSourceOptions {
  return {
    type: "postgres",
    url: databaseUrl,
    entities: [...BILLING_TYPEORM_ENTITIES],
    migrations: [
      CreateBillingTables1754352000000,
      OneActivePaymentPerOrder1754352001000,
    ],
    migrationsTableName: "typeorm_migrations",
    migrationsRun: false,
    synchronize: false,
  };
}

export function createTypeOrmDataSource(databaseUrl: string): DataSource {
  return new DataSource(createTypeOrmOptions(databaseUrl));
}
