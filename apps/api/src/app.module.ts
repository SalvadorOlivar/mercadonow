import { Module } from "@nestjs/common";
import { ConfigModule } from "@nestjs/config";
import { APP_FILTER, APP_PIPE } from "@nestjs/core";
import { BillingModule } from "./billing/billing.module";
import { GlobalExceptionFilter } from "./common/http/global-exception.filter";
import { createRequestValidationPipe } from "./common/http/request-validation.pipe";
import { validateEnvironment } from "./config/environment";
import { DatabaseModule } from "./database/database.module";

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true, validate: validateEnvironment }),
    DatabaseModule,
    BillingModule,
  ],
  providers: [
    { provide: APP_PIPE, useValue: createRequestValidationPipe() },
    { provide: APP_FILTER, useClass: GlobalExceptionFilter },
  ],
})
export class AppModule {}
