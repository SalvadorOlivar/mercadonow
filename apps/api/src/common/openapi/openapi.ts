import type { INestApplication } from "@nestjs/common";
import {
  DocumentBuilder,
  SwaggerModule,
  type OpenAPIObject,
} from "@nestjs/swagger";

export const OPENAPI_UI_PATH = "docs";
export const OPENAPI_JSON_PATH = "docs-json";

export function createOpenApiDocument(
  app: INestApplication,
): OpenAPIObject {
  const configuration = new DocumentBuilder()
    .setTitle("MercadoNow Billing API")
    .setDescription(
      "Public HTTP contract for the MercadoNow fictional Billing MVP.",
    )
    .setVersion("0.1.0")
    .addTag("Billing")
    .build();

  return SwaggerModule.createDocument(app, configuration, {
    operationIdFactory: (_controllerKey, methodKey) => methodKey,
  });
}

export function setupOpenApi(app: INestApplication): OpenAPIObject {
  const document = createOpenApiDocument(app);
  SwaggerModule.setup(OPENAPI_UI_PATH, app, document, {
    jsonDocumentUrl: OPENAPI_JSON_PATH,
  });
  return document;
}
