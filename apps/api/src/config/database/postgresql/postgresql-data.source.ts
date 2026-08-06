import { DataSource, type DataSourceOptions } from 'typeorm';

import { POSTGRESQL_ENTITIES } from './entities/postgresql.entities';

export const createPostgresqlDataSourceOptions = (
  databaseUrl: string,
): DataSourceOptions => {
  return {
    type: 'postgres',
    url: databaseUrl,
    entities: [...POSTGRESQL_ENTITIES],
    migrations: [],
    migrationsTableName: 'typeorm_migrations',
    migrationsRun: false,
    synchronize: false,
    logging: false,
  };
};

export const createPostgresqlDataSource = (
  databaseUrl: string,
): DataSource =>
  new DataSource(createPostgresqlDataSourceOptions(databaseUrl));