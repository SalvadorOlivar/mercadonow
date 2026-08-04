# Billing MVP — plan de ejecución

Este roadmap ordena las issues existentes por dependencias técnicas y por flujo
de negocio. La unidad de avance es un paso pequeño con pruebas y checkpoint de
revisión; no se encadenan todas las etapas en un único cambio.

## Estado actual

Completado:

- #1 estructura del proyecto.
- #2 configuración de TypeScript.
- #3 configuración de NestJS.
- #4 PostgreSQL local y conexión de la API.
- #17 scaffold del frontend Next.js.
- #18 migraciones iniciales de Billing.
- #19 `Order` como agregado independiente.
- #20 `Invoice` como agregado independiente.
- #21 `Payment` como agregado independiente.
- #22 `CreateOrder` en la capa de aplicación.
- #23 `CreatePayment`, incluyendo procesamiento mediante un gateway y reintentos.
- #24 `CreateInvoice` para pagos autorizados.
- #25 `GetInvoice` con salida serializable y error tipado.
- `Money`, errores de dominio y puertos `OrderRepository`,
  `PaymentRepository` e `InvoiceRepository`.
- Adaptadores PostgreSQL para órdenes, pagos y facturas, con un transaction
  manager para que los casos de uso sean dueños de la transacción.
- Pruebas unitarias iniciales del dominio.

El happy path ya existe en la capa de aplicación, pero todavía no es ejecutable
por HTTP. `BillingModule` está registrado, pero los casos de uso, adaptadores de
IDs, gateway y capa `presentation` aún no están cableados.

## Orden de ejecución recomendado

### Etapa 1 — Crear órdenes en la capa de aplicación

1. **#22 — Implement CreateOrder use case — completada**
   - Definir los contratos de entrada y salida de aplicación.
   - Generar/recibir el `OrderId` UUID v7 en la frontera apropiada.
   - Crear `Order` y persistirlo mediante `OrderRepository`.
   - Agregar pruebas unitarias con un repositorio fake/mock.

**Checkpoint:** `CreateOrder` funciona sin NestJS ni PostgreSQL y todas sus
reglas están cubiertas por pruebas.

### Etapa 2 — Preparar persistencia PostgreSQL

2. **#4 — Create PostgreSQL database — completada**
   - Confirmar configuración local, `DATABASE_URL` y conexión desde la API.
3. **#18 — Create database migrations — completada**
   - Crear tablas para orders, order items, payments e invoices.
   - Incluir claves, estados, importes en centavos e índices necesarios.
4. **Hueco de planificación — implementar adaptadores PostgreSQL — completado**
   - `PostgresOrderRepository`.
   - `PostgresPaymentRepository`.
   - `PostgresInvoiceRepository`.
   - Unidad de trabajo/transacción en la capa de aplicación cuando una
     operación modifique más de un agregado.

**Checkpoint:** una orden puede guardarse y reconstruirse desde PostgreSQL sin
que el dominio importe `pg` ni NestJS.

### Etapa 3 — Completar el happy path de Billing

5. **#23 — Implement CreatePayment use case — completada**
   - Buscar la orden y validar que esté pendiente de pago.
   - Crear el pago por el total de la orden.
   - Definir explícitamente si esta issue solo crea un intento `PENDING` o
     también procesa/autoriza el cobro mediante un gateway.
   - Al autorizarse, persistir `Payment` y actualizar `Order` dentro de una
     transacción.
   - Agregar pruebas unitarias de éxito, rechazo e idempotencia/reintento.
6. **#24 — Implement CreateInvoice use case — completada**
   - Exigir un pago autorizado para la orden.
   - Crear la factura relacionada mediante `orderId` y `paymentId`.
   - Evitar más de una factura para el mismo pago.
   - Agregar pruebas unitarias.
7. **#25 — Implement GetInvoice use case — completada**
   - Buscar por `InvoiceId`.
   - Lanzar un error tipado cuando no exista.
   - Devolver un modelo de salida, no la entidad directamente.
   - Agregar pruebas unitarias.

**Checkpoint:** el flujo `Order → Payment → Invoice` funciona desde casos de
uso y persiste sus cambios de forma consistente.

### Etapa 4 — Exponer el flujo mediante HTTP

8. **#26 — Create REST API**
   - Controllers delgados: HTTP → DTO → caso de uso.
   - DTOs y validación de entrada.
   - Serialización de dinero como `MoneyDTO`.
   - Filtro global que transforme errores tipados en respuestas HTTP.
   - Registrar controllers, casos de uso y adaptadores en `BillingModule`.
   - Como mínimo: `POST /orders`, `POST /orders/:id/payments`,
     `POST /orders/:id/invoices` y `GET /invoices/:id`.

**Checkpoint:** el happy path puede ejecutarse con HTTP/Postman y los errores
tienen un formato consistente.

### Etapa 5 — Consolidar la estrategia de pruebas

9. **#28 — Add unit tests**
   - Esta issue consolida cobertura y casos borde; las pruebas unitarias se
     escriben durante #22–#25, no se posponen hasta esta etapa.
10. **#29 — Add integration tests**
    - Probar adaptadores PostgreSQL contra una base real de test.
    - Verificar mapeo fila ↔ entidad, constraints y transacciones.
11. **#30 — Add E2E tests**
    - Levantar la aplicación completa y recorrer el happy path REST.
    - Cubrir al menos validación de entrada, recurso inexistente y transición
      inválida.

**Checkpoint final:** typecheck, lint, unitarias, integración y E2E pasan desde
la raíz del monorepo.

## Huecos respecto de los requisitos

Antes de declarar terminado el Billing MVP hay que decidir si estos casos de
uso entran en el milestone. Están documentados en
`docs/01-product/requirements.md`, pero no tienen una issue equivalente entre
#1 y #30:

- **UC-002 Get Order:** falta caso de uso y endpoint `GET /orders/:id`.
- **UC-003 Process Payment:** #23 crea el intento y también lo procesa mediante
  un gateway; ADR-002 documenta la frontera transaccional y los reintentos.
- **UC-006 Request Refund y UC-007 Get Refund:** no existe todavía el agregado,
  repositorio, casos de uso ni API de `Refund` dentro del milestone actual.
- **Adaptadores de repositorio PostgreSQL:** los puertos existen y #18 cubre
  migraciones, pero ninguna issue existente nombra sus implementaciones.

No se deben crear estas issues automáticamente. Primero se define si pertenecen
al alcance del Billing MVP y luego se actualiza el milestone sin duplicar las
issues existentes.

## Evolución posterior al MVP

Mantener `Order`, `Payment` e `Invoice` dentro del módulo `billing` mientras la
separación no resuelva un problema real. Si sus reglas, equipos o ritmos de
cambio divergen, pueden extraerse gradualmente a módulos `orders`, `payments` e
`invoicing` dentro del mismo monolito antes de considerar microservicios.
