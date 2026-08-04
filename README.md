# Proyecto MercadoNow — Contexto Maestro

## Contexto del proyecto

Estoy desarrollando un proyecto personal llamado **MercadoNow**, inspirado conceptualmente en plataformas de delivery y quick-commerce como PedidosYa.

El proyecto nace como una iniciativa de aprendizaje y portfolio profesional. Mi objetivo es construir progresivamente una plataforma de software con un nivel de calidad y complejidad similar al que podría encontrarse en una empresa tecnológica de escala, utilizando el proyecto para prepararme para posiciones de **Software Engineer Fullstack, Backend Engineer y eventualmente Software Architect**.

Actualmente trabajo como **DevOps Engineer** y tengo experiencia principalmente en:

* AWS
* Azure
* GCP
* Terraform
* Kubernetes
* Docker
* Helm
* CI/CD
* Observabilidad
* Prometheus
* Grafana
* Loki
* OpenTelemetry
* Infraestructura Cloud

También tengo experiencia y conocimientos en desarrollo con tecnologías como:

* Go
* Node.js
* TypeScript / JavaScript
* NestJS
* Next.js
* React
* Python
* SQL
* PostgreSQL

Mi objetivo profesional es fortalecer principalmente mis conocimientos de:

* Desarrollo Fullstack
* Node.js y TypeScript a nivel avanzado
* React
* Diseño de aplicaciones
* Clean Architecture
* SOLID
* Domain-Driven Design
* Diseño de APIs
* Testing
* TDD / BDD
* Sistemas distribuidos
* Arquitectura orientada a eventos
* Bases de datos SQL y NoSQL
* Observabilidad aplicada al desarrollo de software
* Cloud Architecture
* Diseño de sistemas escalables

Quiero aprovechar mis conocimientos previos de DevOps, Cloud, Kubernetes, Terraform y Observabilidad como una ventaja, pero el foco principal del proyecto debe estar en fortalecer mi perfil como **Software Engineer y futuro Software Architect**.

---

# Objetivo del proyecto

Construir una plataforma ficticia llamada **MercadoNow**, que simula una plataforma de comercio digital y delivery.

El foco inicial del proyecto será el dominio de **Billing / Facturación**.

El sistema debe simular un entorno realista donde existan:

* Clientes
* Comercios
* Productos
* Órdenes
* Pagos
* Facturas
* Reembolsos
* Comisiones
* Liquidaciones a comercios

Sin embargo, el proyecto debe desarrollarse progresivamente.

No quiero empezar construyendo microservicios, Kubernetes, AWS, Kafka, Terraform, etc.

Quiero comenzar con un sistema pequeño y funcional y evolucionarlo progresivamente.

La idea es aprender arquitectura mediante la evolución del sistema.

---

# Objetivo profesional

El proyecto está inspirado parcialmente en una oferta laboral de **Software Engineer Fullstack en el equipo de Billing de PedidosYa**.

La oferta mencionaba conocimientos y experiencia en:

* Node.js
* React
* JavaScript
* TypeScript
* SOLID
* Clean Architecture
* Diseño de APIs
* Estructuras modulares
* MVC
* SQL
* MongoDB o DynamoDB
* Unit Testing
* Integration Testing
* End-to-End Testing
* React Testing Library
* Jest
* Cypress
* TDD
* BDD
* Logging
* Métricas
* Tracing
* Grafana
* CI/CD
* Jenkins
* AWS / GCP / Azure
* Docker
* Kubernetes

El proyecto debe utilizar estos requisitos como inspiración para decidir qué conceptos aprender y practicar.

No es necesario implementar todo desde el comienzo.

---

# Estrategia de evolución

El proyecto debe evolucionar aproximadamente en estas etapas:

## Fase 1 — Billing MVP

Comenzar con una arquitectura sencilla:

```text
React / Next.js
        │
        ▼
Node.js / NestJS
        │
        ▼
PostgreSQL
```

El objetivo es construir un MVP funcional.

El flujo inicial podría ser:

```text
Customer
    │
    ▼
Create Order
    │
    ▼
Process Payment
    │
    ▼
Generate Invoice
    │
    ▼
Consult Invoice
```

El MVP debe permitir inicialmente:

* Crear una orden
* Procesar un pago
* Generar una factura
* Consultar una factura

Posiblemente posteriormente:

* Reembolsos
* Comisiones
* Liquidaciones

El proyecto actualmente ya tiene un repositorio en GitHub.

También creé un **Milestone llamado "Billing MVP"** y ya definí los Issues correspondientes dentro de ese milestone.

Por lo tanto, no es necesario volver a crear el milestone ni volver a definir los Issues desde cero.

El siguiente trabajo debe partir de los Issues existentes.

---

# Fase 2 — Arquitectura y calidad

Una vez funcional el MVP, profundizar en:

* Clean Architecture
* SOLID
* Modular Architecture
* Dependency Injection
* Repository Pattern
* Use Cases
* Domain Services
* DTOs
* API Contracts
* Validación
* Manejo de errores

El objetivo es que el proyecto no sea simplemente un CRUD.

Quiero entender por qué se toman las decisiones arquitectónicas y cuáles son sus trade-offs.

### Quality gate local

El mismo quality gate usado por CI se ejecuta desde la raíz:

```bash
pnpm verify
```

El comando ejecuta typecheck, lint, pruebas unitarias, pruebas de integración,
E2E y build. Las suites que usan PostgreSQL requieren el servicio local:

```bash
docker compose up -d postgres
```

Las pruebas crean y reinicializan exclusivamente una base cuyo nombre termina
en `_test`; por defecto usan `mercadonow_test`. El setup aplica todas las
migraciones vigentes mediante el mismo runner utilizado en desarrollo.

---

# Fase 3 — Testing

Implementar progresivamente:

### Unit Tests

Para:

* Domain entities
* Value objects
* Use cases
* Business rules
* Billing calculations

### Integration Tests

Para:

* Repositories
* PostgreSQL
* APIs
* Database interactions

### End-to-End Tests

Para flujos completos como:

```text
Create Order
    ↓
Process Payment
    ↓
Generate Invoice
    ↓
Get Invoice
```

Tecnologías posibles:

* Jest
* React Testing Library
* Playwright o Cypress

También quiero aprender y aplicar TDD en algunas partes del dominio.

No es necesario utilizar TDD absolutamente en todo el proyecto.

---

# Fase 4 — Event-Driven Architecture

Una vez que el MVP esté estable, evolucionar hacia procesamiento asíncrono.

Introducir:

* RabbitMQ o Kafka
* Events
* Consumers
* Producers
* Workers
* Retry
* Dead Letter Queues
* Idempotency
* Eventual Consistency

Ejemplos de eventos:

```text
OrderCreated
PaymentAuthorized
PaymentFailed
OrderCompleted
InvoiceCreated
InvoicePaid
RefundCreated
PayoutCreated
```

Un posible flujo:

```text
OrderCreated
      │
      ▼
Message Broker
      │
      ├───────────────┐
      ▼               ▼
Billing Service   Analytics Service
      │
      ▼
InvoiceCreated
      │
      ▼
Notification Service
```

Un objetivo importante será aprender conceptos de sistemas distribuidos y entender problemas reales como:

* Duplicación de mensajes
* Idempotencia
* Reintentos
* Procesamiento eventual
* Fallos parciales
* Consistencia eventual

---

# Fase 5 — SQL y NoSQL

Inicialmente utilizar PostgreSQL como base de datos principal.

Posteriormente explorar el uso de una base NoSQL como MongoDB.

PostgreSQL podría utilizarse para:

* Customers
* Orders
* Payments
* Invoices
* Invoice Items
* Refunds
* Payouts

MongoDB podría utilizarse para casos como:

* Audit logs
* Billing events
* Event history
* Payment provider responses
* Snapshots

La decisión de introducir NoSQL debe estar justificada por el caso de uso.

No quiero utilizar tecnologías únicamente para poder decir que las utilicé.

---

# Fase 6 — Frontend

Construir una interfaz con:

* React
* TypeScript
* Next.js

El frontend debería incluir progresivamente:

* Login
* Dashboard
* Lista de facturas
* Detalle de factura
* Historial de eventos
* Reembolsos
* Filtros
* Búsqueda
* Paginación
* Loading states
* Error states

Podría utilizarse:

* TanStack Query
* React Testing Library

---

# Fase 7 — BFF

Introducir un Backend for Frontend.

Arquitectura conceptual:

```text
React / Next.js
       │
       ▼
      BFF
       │
       ├── Billing API
       ├── Transactions API
       └── Analytics API
```

El objetivo es aprender:

* Backend for Frontend
* API Composition
* DTOs
* API Contracts

El frontend no debería depender directamente de la estructura interna de todos los servicios.

---

# Fase 8 — Observabilidad

Esta es un área donde ya tengo bastante experiencia, por lo que quiero utilizarla para aprender cómo aplicar observabilidad desde la perspectiva del desarrollo de software.

Posible stack:

* OpenTelemetry
* Prometheus
* Grafana
* Loki
* Tempo
* Grafana Alloy

Arquitectura:

```text
Application
     │
     ▼
OpenTelemetry
     │
     ├── Metrics → Prometheus
     ├── Logs → Loki
     └── Traces → Tempo
                    │
                    ▼
                  Grafana
```

Quiero observar:

* Request rate
* Error rate
* Latency
* P95
* P99
* Invoices created
* Invoices failed
* Payment failures
* Refunds
* Queue size
* Worker processing time

También quiero aprender a definir alertas y SLOs básicos.

---

# Fase 9 — Docker

Containerizar progresivamente:

* Frontend
* Backend
* Workers
* PostgreSQL
* MongoDB
* RabbitMQ

Inicialmente utilizar Docker Compose para desarrollo local.

---

# Fase 10 — Kubernetes

Posteriormente desplegar el sistema en Kubernetes.

Explorar:

* Deployments
* Services
* Ingress
* ConfigMaps
* Secrets
* HPA
* Liveness probes
* Readiness probes
* Resource requests
* Resource limits

También explorar KEDA para escalar workers según la cantidad de mensajes pendientes en una cola.

---

# Fase 11 — Cloud

Eventualmente desplegar en AWS.

Posible arquitectura:

```text
CloudFront
    │
    ▼
Frontend
    │
    ▼
ALB / API Gateway
    │
    ▼
EKS
    │
    ├── BFF
    ├── Billing API
    └── Workers
          │
          ├── RDS PostgreSQL
          ├── Redis
          └── SQS / RabbitMQ
```

La infraestructura debe gestionarse mediante Terraform.

No es necesario utilizar todos estos servicios.

Las decisiones deben justificarse según las necesidades reales del proyecto.

---

# Fase 12 — CI/CD

Implementar progresivamente:

```text
Git Push
   │
   ▼
Lint
   │
   ▼
Unit Tests
   │
   ▼
Integration Tests
   │
   ▼
E2E Tests
   │
   ▼
Build
   │
   ▼
Docker Image
   │
   ▼
Security Scan
   │
   ▼
Container Registry
   │
   ▼
Deploy
```

Tecnologías posibles:

* GitHub Actions
* Docker
* Helm
* ArgoCD

---

# Arquitectura objetivo aproximada

La arquitectura final podría evolucionar hacia algo similar a:

```text
                         USER
                           │
                           ▼
                     Next.js / React
                           │
                           ▼
                         BFF
                           │
                  ┌────────┴────────┐
                  │                 │
                  ▼                 ▼
           Billing API        Analytics API
                  │
                  ▼
             PostgreSQL
                  │
                  ▼
             Event Broker
                  │
          ┌───────┼───────┐
          ▼       ▼       ▼
       Worker   Audit   Notification
          │
          ▼
       MongoDB


                 OBSERVABILITY

Application
     │
     ▼
OpenTelemetry
     │
 ┌───┼────┐
 ▼   ▼    ▼
Logs Metrics Traces
 │    │     │
 ▼    ▼     ▼
Loki Prometheus Tempo
 │    │     │
 └────┼─────┘
      ▼
   Grafana


                    CI/CD

GitHub
   │
   ▼
GitHub Actions
   │
   ▼
Docker Registry
   │
   ▼
Helm
   │
   ▼
ArgoCD
   │
   ▼
Kubernetes
   │
   ▼
AWS
```

Esta arquitectura es un objetivo de largo plazo, no el punto de partida.

---

# Principio fundamental del proyecto

El proyecto debe evolucionar de manera incremental.

No comenzar directamente con:

* Microservices
* Kubernetes
* Kafka
* AWS
* Terraform
* MongoDB

Primero:

```text
Modular Monolith
+
PostgreSQL
+
React
+
Node.js
```

Después introducir complejidad cuando exista una razón técnica.

La evolución esperada es:

```text
Modular Monolith
       │
       ▼
Clean Architecture
       │
       ▼
Testing
       │
       ▼
Async Processing
       │
       ▼
Event-Driven Architecture
       │
       ▼
Observability
       │
       ▼
Docker
       │
       ▼
Kubernetes
       │
       ▼
Cloud
       │
       ▼
CI/CD
```

---

# Documentación

El repositorio debe ser también una documentación del proceso de aprendizaje.

La estructura puede evolucionar hacia:

```text
docs/
├── 01-product/
│   ├── vision.md
│   ├── requirements.md
│   └── roadmap.md
│
├── 02-architecture/
│   ├── architecture-overview.md
│   ├── domain-model.md
│   └── decisions/
│
├── 03-api/
│   └── api-specification.md
│
├── 04-database/
│   └── data-model.md
│
├── 05-testing/
│   └── testing-strategy.md
│
├── 06-observability/
│   └── observability.md
│
├── 07-infrastructure/
│   └── infrastructure.md
│
└── engineering-journal/
```

También se recomienda documentar decisiones arquitectónicas mediante ADRs:

```text
ADR-001-modular-monolith.md
ADR-002-postgresql.md
ADR-003-rabbitmq.md
ADR-004-event-driven-architecture.md
ADR-005-idempotency.md
```

Cada ADR debería explicar:

* Context
* Problem
* Alternatives
* Decision
* Trade-offs
* Consequences

---

# Forma de trabajar en este proyecto

Quiero trabajar de manera incremental, como si estuviera acompañado por un **Tech Lead / Software Architect / Mentor**.

No quiero recibir grandes cantidades de código sin entender las decisiones.

Prefiero:

1. Entender el problema.
2. Analizar alternativas.
3. Tomar una decisión.
4. Documentarla.
5. Crear una tarea pequeña.
6. Implementarla.
7. Probarla.
8. Revisarla.
9. Continuar con el siguiente paso.

Quiero que se cuestionen mis decisiones cuando sea necesario y que se expliquen los trade-offs.

Si existe una solución más sencilla, prefiero comenzar por ella y evolucionar posteriormente.

No quiero sobreingeniería prematura.

---

# Estado actual

El repositorio GitHub ya fue creado.

El proyecto se llama:

**MercadoNow**

Ya existe un Milestone:

**Billing MVP**

El Milestone ya tiene sus Issues definidos.

Por lo tanto, el próximo paso debe ser trabajar sobre los Issues existentes y avanzar progresivamente hacia la implementación del MVP.

No es necesario volver a crear el Milestone ni redefinir todos los Issues desde cero.

---

# Objetivo del MVP

El primer objetivo concreto es tener una aplicación funcional capaz de implementar un flujo similar a:

```text
Customer
    │
    ▼
Create Order
    │
    ▼
Process Payment
    │
    ▼
Generate Invoice
    │
    ▼
View Invoice
```

Con:

```text
Frontend
React / Next.js

Backend
Node.js / TypeScript / NestJS

Database
PostgreSQL

Architecture
Modular Monolith
```

Una vez que este MVP esté funcionando correctamente, el sistema se evolucionará progresivamente.

---

# Regla principal

El objetivo final no es simplemente "terminar una aplicación".

El objetivo es utilizar MercadoNow como un **laboratorio de ingeniería de software** para aprender a diseñar, construir, probar, observar, desplegar y evolucionar sistemas reales.

Cada nueva tecnología debe incorporarse cuando exista un problema o una necesidad que justifique su introducción.

La prioridad es comprender:

* Por qué se toma cada decisión.
* Qué problema resuelve.
* Qué alternativas existen.
* Qué trade-offs introduce.
* Cómo la arquitectura puede evolucionar.

El proyecto debe terminar siendo también una pieza de portfolio profesional que pueda ser presentada en entrevistas técnicas para posiciones de Software Engineer y Software Architect.
