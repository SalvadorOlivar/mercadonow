import { Global, Module } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { Pool } from "pg";

import { POSTGRES_POOL } from "./database.constants";
import { DatabaseService } from "./database.service";
import type { EnvironmentVariables } from "../config/environment";

@Global()
@Module({
  providers: [
    {
      provide: POSTGRES_POOL,
      inject: [ConfigService],
      useFactory: (config: ConfigService<EnvironmentVariables>): Pool => {
        const connectionString = config.getOrThrow("DATABASE_URL", {
          infer: true,
        });
        return new Pool({ connectionString });
      },
    },
    DatabaseService,
  ],
  exports: [POSTGRES_POOL, DatabaseService],
})
export class DatabaseModule {}
