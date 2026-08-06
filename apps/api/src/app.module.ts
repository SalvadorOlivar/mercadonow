import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { APP_FILTER, APP_PIPE } from '@nestjs/core';
import { TypeOrmModule } from '@nestjs/typeorm';

import { BillingModule } from './billing/billing.module';
import { GlobalExceptionFilter } from './common/http/global-exception.filter';
import { createRequestValidationPipe } from './common/http/request-validation.pipe';
import { createPostgresqlDataSourceOptions } from './config/database/postgresql/postgresql-data.source';
import {
  validateEnvironment,
  type EnvironmentVariables,
} from './config/environment';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      validate: validateEnvironment,
    }),

    TypeOrmModule.forRootAsync({
      inject: [ConfigService],

      useFactory: (
        configService: ConfigService<EnvironmentVariables, true>,
      ) => {
        const databaseUrl = configService.getOrThrow('DATABASE_URL', {
          infer: true,
        });

        return createPostgresqlDataSourceOptions(databaseUrl);
      },
    }),

    BillingModule,
  ],

  providers: [
    {
      provide: APP_PIPE,
      useValue: createRequestValidationPipe(),
    },
    {
      provide: APP_FILTER,
      useClass: GlobalExceptionFilter,
    },
  ],
})
export class AppModule {}