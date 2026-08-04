import { Global, Module } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { Pool } from "pg";

import { POSTGRES_POOL } from "./database.constants";
import { DatabaseService } from "./database.service";

@Global()
@Module({
  providers: [
    {
      provide: POSTGRES_POOL,
      inject: [ConfigService],
      useFactory: (config: ConfigService): Pool => {
        const connectionString = config.get<string>("DATABASE_URL");
        if (connectionString === undefined || connectionString.length === 0) {
          throw new Error("DATABASE_URL is required");
        }

        return new Pool({ connectionString });
      },
    },
    DatabaseService,
  ],
  exports: [POSTGRES_POOL, DatabaseService],
})
export class DatabaseModule {}

