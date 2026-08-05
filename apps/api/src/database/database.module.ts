import { Global, Module } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { TypeOrmModule } from "@nestjs/typeorm";

import type { EnvironmentVariables } from "../config/environment";
import { createTypeOrmOptions } from "./typeorm-data-source";

@Global()
@Module({
  imports: [
    TypeOrmModule.forRootAsync({
      inject: [ConfigService],
      useFactory: (config: ConfigService<EnvironmentVariables>) =>
        createTypeOrmOptions(
          config.getOrThrow("DATABASE_URL", { infer: true }),
        ),
    }),
  ],
  exports: [TypeOrmModule],
})
export class DatabaseModule {}
