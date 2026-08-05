import { NestFactory } from "@nestjs/core";
import { ConfigService } from "@nestjs/config";
import { AppModule } from "./app.module";
import { setupOpenApi } from "./common/openapi/openapi";
import type { EnvironmentVariables } from "./config/environment";

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  const config = app.get<ConfigService<EnvironmentVariables>>(ConfigService);
  const corsOrigins = config.getOrThrow("CORS_ORIGINS", { infer: true });
  const port = config.getOrThrow("PORT", { infer: true });
  const openApiEnabled = config.getOrThrow("OPENAPI_ENABLED", { infer: true });

  app.enableCors({ origin: [...corsOrigins] });
  if (openApiEnabled) setupOpenApi(app);
  app.enableShutdownHooks();
  app.setGlobalPrefix('api/v1');
  await app.listen(port);
}

bootstrap();
