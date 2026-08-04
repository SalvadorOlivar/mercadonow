import { Module } from "@nestjs/common";
import { ConfigModule } from "@nestjs/config";
import { BillingModule } from "./billing/billing.module";
import { DatabaseModule } from "./database/database.module";

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    DatabaseModule,
    BillingModule,
  ],
})
export class AppModule {}
