# Guía de procesos · Setup del microservicio de Incidentes (Grupo 5)

**FleetOps · Desarrollo de Software III** · Versión 1.0 · 28/10/2026
Base: DAS v3.0 (27/10/2026) y Convenios de FleetOps v2.0.

Esta guía describe, en orden, todo lo que hay que configurar antes de empezar a desarrollar las historias de usuario: repositorio, ramas y rulesets, arquetipo, integración continua, SonarCloud, Qodo, Docker Hub, instancia EC2 y despliegue continuo. Cada fase termina con una lista de verificación; no pasen a la siguiente sin cumplirla.

---

## Índice

0. [Resumen del flujo y prerrequisitos](#0-resumen-del-flujo-y-prerrequisitos)
1. [Repositorio en GitHub y estrategia de ramas](#1-repositorio-en-github-y-estrategia-de-ramas)
2. [Arquetipo de la aplicación (qué debe contener)](#2-arquetipo-de-la-aplicación-qué-debe-contener)
3. [Pruebas base y cobertura ≥ 80 %](#3-pruebas-base-y-cobertura--80-)
4. [Integración continua (CI) en `develop`](#4-integración-continua-ci-en-develop)
5. [SonarCloud](#5-sonarcloud)
6. [Qodo (revisor con IA, opcional)](#6-qodo-revisor-con-ia-opcional)
7. [Rulesets de las ramas](#7-rulesets-de-las-ramas)
8. [Docker Hub](#8-docker-hub)
9. [Instancia EC2 en AWS](#9-instancia-ec2-en-aws)
10. [Despliegue continuo (CD) desde `main`](#10-despliegue-continuo-cd-desde-main)
11. [Verificación end-to-end (Swagger, health, metrics)](#11-verificación-end-to-end-swagger-health-metrics)
12. [Proceso de desarrollo del día a día](#12-proceso-de-desarrollo-del-día-a-día)
13. [Problemas frecuentes](#13-problemas-frecuentes)
14. [Anexos: secretos, checklist final y referencias](#14-anexos)

---

## 0. Resumen del flujo y prerrequisitos

### Flujo objetivo

```
feature/HU_FLEETOPS_INC_xx ──PR──▶ develop ──PR (release)──▶ main ──push──▶ CD
                              │                         │                 │
                     CI: build + lint + tests     CI completo otra vez    ├─ build imagen Docker
                     + cobertura + SonarCloud     + revisores             ├─ push a Docker Hub
                     + Qodo (comentarios)                                 └─ SSH a EC2 → docker compose pull/up
```

- **CI** (sección 4): corre en cada Pull Request hacia `develop` (y también hacia `main`). Compila, ejecuta lint y pruebas con cobertura y envía el análisis a SonarCloud. Si el Quality Gate falla, el PR no se puede fusionar.
- **CD** (sección 10): corre solo cuando algo llega a `main`. Construye la imagen, la publica en Docker Hub y la despliega en EC2 con `docker compose`.
- **Rulesets** (sección 7): impiden pushes directos a `main` y `develop` y exigen PR, aprobaciones y checks en verde.

### Cuentas necesarias

| Cuenta | Para qué | Quién la crea |
|---|---|---|
| GitHub (organización del curso) | Repositorio, Actions, rulesets | Líder técnico del grupo (admin del repo) |
| SonarCloud (login con GitHub) | Análisis estático y cobertura | Admin del repo |
| Qodo (opcional) o una API key de un LLM | Revisión automática de PR | Admin del repo |
| Docker Hub | Registro de la imagen | Uno del equipo (cuenta compartida o de organización) |
| AWS | Instancia EC2 | Quien tenga la cuenta AWS (Academy / Free Tier) |

### Herramientas locales de cada integrante

- Node.js **24 LTS** (el DAS fija la imagen `node:24.22.1-bookworm-slim`).
- npm 10+, Git, Docker Desktop (o Docker Engine 29 + Compose v5).
- VS Code con extensiones: ESLint, Prettier, Prisma, SonarQube for IDE (opcional pero recomendado: detecta los mismos issues que SonarCloud antes del PR).

### Decisiones fijas que vienen del DAS (no se discuten en el setup)

| Tema | Decisión |
|---|---|
| Framework | NestJS `^12.2`, **CommonJS** (ADR-03) |
| Lenguaje | TypeScript **`~6.0`** (no 7: rompe `nest build` y `ts-jest`) |
| ORM | Prisma **`^7`** (no 8: npm ya ofrece 8 RC con otra API) |
| BD | PostgreSQL 18.6 (`postgres:18.6-bookworm`) |
| Pruebas | Jest `^30.5` + `ts-jest` `^29.4` + `@nestjs/testing` |
| Mensajería | AWS SNS (topic `incident-events`) — LocalStack en local |
| Calidad | SonarCloud con Quality Gate obligatorio |
| Despliegue | Docker en EC2 vía pipeline |

---

## 1. Repositorio en GitHub y estrategia de ramas

### 1.1 Crear el repositorio

1. En la organización de GitHub del curso: **New repository**.
2. Nombre sugerido: `fleetops-incident` (slug del servicio = `incident`, coherente con `source = incident` del sobre de eventos).
3. Visibilidad: **Public** si el curso lo permite (SonarCloud y Qodo son gratuitos para repos públicos; en privado SonarCloud cobra). Si debe ser privado, confirmen el plan antes de seguir.
4. Inicializar con `README.md`, `.gitignore` plantilla **Node** y sin licencia (o la que indique el curso).
5. **Settings → General → Pull Requests**: activar *Allow squash merging*, desactivar *Allow merge commits* (historial limpio), activar *Automatically delete head branches*.

### 1.2 Dar acceso al equipo

**Settings → Collaborators and teams**: agregar a los cinco integrantes con rol **Write**; el líder técnico queda como **Admin** (los rulesets solo los edita un admin).

### 1.3 Crear las ramas base

```bash
git clone git@github.com:<org>/fleetops-incident.git
cd fleetops-incident
git checkout -b develop
git push -u origin develop
```

- `main`: lo que está en producción (EC2). Solo recibe PR desde `develop` (o `hotfix/*`).
- `develop`: integración. Recibe PR de `feature/*`.
- `feature/HU_FLEETOPS_INC_xx-descripcion-corta`: una por historia de usuario.
- `hotfix/descripcion`: correcciones urgentes sobre `main`.
- `chore/*` o `ci/*`: cambios de configuración (pipelines, Sonar, Docker).

**Settings → General → Default branch**: dejar `develop` como rama por defecto (los PR se abren contra `develop` sin tener que cambiarlo cada vez). Ojo: Qodo/PR-Agent lee `.pr_agent.toml` de la rama por defecto.

### 1.4 Convención de commits

Usen Conventional Commits, en inglés para ser coherentes con los convenios:

```
feat(incidents): add POST /incidents validation chain
fix(outbox): retry publish with exponential backoff
test(incidents): cover assignment_not_in_progress (409)
ci: add SonarCloud analysis to pull requests
chore: bump prisma to 7.10.1
```

### ✅ Verificación de la fase 1

- [ ] Repo creado en la organización, `develop` existe y es la rama por defecto.
- [ ] Los cinco integrantes tienen acceso de escritura.
- [ ] Squash merge activo y borrado automático de ramas.

---

## 2. Arquetipo de la aplicación (qué debe contener)

El arquetipo es la **línea base de código** sobre la que se desarrollan las HU. No implementa lógica de negocio: los endpoints existen, están documentados en Swagger y responden (por ejemplo, `501 not_implemented` con el formato de error estándar), pero todas las capas, dependencias y conexiones ya quedan armadas.

> Trabajen el arquetipo en una rama `chore/archetype` y fusiónenlo a `develop` por PR **después** de tener la CI de la sección 4, para que ese primer PR ya pase por el pipeline.

### 2.1 Generar el proyecto (y ajustarlo al DAS)

```bash
npx @nestjs/cli@12 new fleetops-incident --skip-git --package-manager npm --strict
```

**Importante:** la CLI de NestJS 12 genera por defecto un proyecto **ESM** (`"type": "module"`) con **Vitest** y **oxlint**. El DAS (ADR-03) define **CommonJS + Jest**, así que después de generarlo hay que:

1. Quitar `"type": "module"` del `package.json`.
2. En `tsconfig.json`: `"module": "commonjs"`, `"moduleResolution": "node"` (o `node10`), mantener `emitDecoratorMetadata` y `experimentalDecorators`, `"target": "ES2023"`, `"strict": true`, y cambiar `types` a `["jest", "node"]`.
3. Desinstalar `vitest`, `@vitest/coverage-v8`, `vite` y borrar `vitest.config*.ts`.
4. Instalar Jest: `jest@^30.5 ts-jest@^29.4 @types/jest@^30 @nestjs/testing@^12`.
5. Lint: pueden dejar oxlint **sin** `--type-aware` (el modo type-aware depende del compilador de TypeScript 7) o cambiar a ESLint 10 + `typescript-eslint@^8.72` (soporta TS `<6.1`). Elijan uno y documéntenlo en el README.
6. Fijar `typescript@~6.0` (no `^`), porque `ts-jest` exige TypeScript `<7`.

### 2.2 Estructura de carpetas (sección 4 del DAS)

```
fleetops-incident/
├── .github/
│   ├── workflows/            ci.yml · cd.yml · pr-agent.yml (opcional)
│   └── pull_request_template.md
├── docs/                     (el profe pidió una carpeta docs por proyecto: DAS, guías, contratos)
├── prisma/
│   ├── schema.prisma
│   └── migrations/20261027000000_init/migration.sql   ← contenido de V1__create_incidents_schema.sql
├── src/
│   ├── incidents/
│   │   ├── api/              IncidentsController, DTO (request/response/list), decoradores Swagger
│   │   ├── application/      IncidentService, cadena de validación, puertos (interfaces + tokens)
│   │   ├── domain/           Incident, Severity, IncidentEventFactory, tipos de eventos (sin Nest ni Prisma)
│   │   ├── infrastructure/   PrismaIncidentRepository, AssignmentsHttpClient, VehiclesHttpClient,
│   │   │                     OutboxPublisher, SnsEventPublisher
│   │   └── incidents.module.ts
│   ├── shared/               PrismaService, config validada, CorrelationIdMiddleware,
│   │                         JwtPayloadMiddleware, GlobalExceptionFilter, catálogo de errores
│   ├── health/               GET /health (Terminus + indicador Prisma)
│   ├── metrics/              GET /metrics (Prometheus)
│   ├── generated/prisma/     cliente generado por Prisma (en .gitignore)
│   ├── app.module.ts
│   └── main.ts               ValidationPipe global, filtro global, Swagger en /docs, enableShutdownHooks
├── test/                     pruebas e2e (opcional en el arquetipo)
├── prisma.config.ts
├── Dockerfile
├── docker-compose.yml        entorno local: app + postgres + migrate + localstack
├── docker-compose.prod.yml   producción (EC2): app + postgres + migrate
├── sonar-project.properties
├── .pr_agent.toml            (si usan PR-Agent)
├── .env.example
├── jest.config.ts (o bloque "jest" en package.json)
└── README.md
```

**Regla de dependencias entre capas (ADR-02):** `api → application → domain`; `infrastructure` implementa los puertos de `application`. Un controlador nunca importa algo de `infrastructure`; Prisma, axios, opossum y el SDK de AWS solo aparecen en `infrastructure` y `shared`.

### 2.3 Dependencias que deben quedar instaladas y conectadas

Versiones verificadas en npm el 28/10/2026:

| Paquete | Versión | Se conecta en |
|---|---|---|
| `@nestjs/common`, `@nestjs/core`, `@nestjs/platform-express` | `^12.3.2` | todo |
| `@nestjs/swagger` | `^12.0.5` | `main.ts` (`/docs`) y DTO |
| `@nestjs/config` + `joi` | `^12.0.1` / `^18` | `shared/config` (validación de env al arrancar) |
| `class-validator`, `class-transformer` | `^0.15.1` / `^0.5.1` | DTO + `ValidationPipe` |
| `@prisma/client`, `@prisma/adapter-pg`, `pg` | `^7.10.1` / `^7.10.1` / `^8` | `shared/PrismaService` |
| `prisma` (CLI) | `^7.10.1` | **en `dependencies`**, no en dev: el contenedor `migrate` de producción lo necesita |
| `dotenv` | `^17` | `prisma.config.ts` (Prisma 7 ya no lee `.env` solo) |
| `@nestjs/axios` + `axios` | `^12.0.1` / `^1.21` | clientes HTTP de Asignaciones y Vehículos |
| `opossum` (+ `@types/opossum`) | `^10.0.0` | circuit breaker de los clientes HTTP |
| `@aws-sdk/client-sns` | `^3` | `SnsEventPublisher` |
| `@nestjs/schedule` | `^12.0.2` | `OutboxPublisher` (tarea periódica) |
| `@nestjs/terminus` | `^12.1.0` | `/health` |
| `@willsoto/nestjs-prometheus` + `@prometheus-io/client` | `^7.0.0` / `^0.16.1` | `/metrics` (no usar `prom-client`) |
| `nestjs-pino` + `pino` + `pino-http` | `^5.3.1` / `^10` / `^11` | logs JSON |
| `nestjs-cls` | `^7.0.2` | `X-Correlation-Id` en AsyncLocalStorage |

Antes de fijar versiones nuevas: `npm view <paquete> version peerDependencies`. Siempre `package-lock.json` en el repo y `npm ci` en Docker y CI.

### 2.4 Puntos de configuración de Prisma 7 (los que más se equivocan)

- Generador nuevo: `provider = "prisma-client"`, con `output = "../src/generated/prisma"` y `moduleFormat = "cjs"`.
- El `datasource` del `schema.prisma` **ya no lleva `url`**: la URL va en `prisma.config.ts` (`datasource: { url: env('DATABASE_URL') }`) con `import 'dotenv/config'` al inicio.
- El cliente se crea con el adaptador: `new PrismaClient({ adapter: new PrismaPg({ connectionString }) })`.
- La migración inicial es el SQL que ya tienen (`V1__create_incidents_schema.sql`) copiado en `prisma/migrations/20261027000000_init/migration.sql`, más el archivo `prisma/migrations/migration_lock.toml` con `provider = "postgresql"`. Los CHECK y el índice parcial viven en ese SQL.
- `src/generated/` va en `.gitignore`; por eso el script `build` debe ejecutar antes `prisma generate` (por ejemplo `"prebuild": "prisma generate"`) y el pipeline también.

### 2.5 Variables de entorno (`.env.example`)

```dotenv
NODE_ENV=development
PORT=3000
TZ=America/Bogota
DATABASE_URL=postgresql://incident:incident@localhost:5432/incident?schema=public
ASSIGNMENTS_BASE_URL=http://localhost:3001
VEHICLES_BASE_URL=http://localhost:3002
HTTP_TIMEOUT_MS=3000
CIRCUIT_BREAKER_ERROR_THRESHOLD=50
CIRCUIT_BREAKER_RESET_TIMEOUT_MS=10000
AWS_REGION=us-east-1
SNS_TOPIC_ARN=arn:aws:sns:us-east-1:000000000000:incident-events
AWS_ENDPOINT_URL=http://localhost:4566     # solo local (LocalStack); vacío en EC2
OUTBOX_POLL_INTERVAL_MS=5000
SWAGGER_ENABLED=true
LOG_LEVEL=info
```

Nunca se sube `.env`; solo `.env.example`.

### 2.6 Endpoints que deben verse en Swagger desde el día 1

| Método y ruta | Respuesta del arquetipo |
|---|---|
| `POST /incidents` | DTO documentado (`assignment_id`, `severity`, `description`, `reported_at`) con ejemplos `minor` y `severe`; responde 501 `not_implemented` |
| `GET /incidents/{id}` | 501 `not_implemented` |
| `GET /incidents` | query params `assignment_id`, `severity`, `reported_from`, `reported_to`, `page`, `size`; 501 |
| `GET /health` | 200 real (consulta `SELECT 1`) |
| `GET /metrics` | 200 real (métricas por defecto de Prometheus) |

Swagger en `/docs` y el JSON en `/docs-json` (lo usarán para publicar el contrato en `fleetops-contracts`).

### 2.7 Contenedores

**Dockerfile multi-stage** (resumen de lo que debe hacer):

1. Etapa `build` desde `node:24.22.1-bookworm-slim`: `npm ci` → `npx prisma generate` → `npm run build`.
2. `npm prune --omit=dev` (quedan solo dependencias de producción, incluida la CLI de Prisma).
3. Etapa final desde la misma imagen: copiar `dist/`, `node_modules/`, `prisma/`, `prisma.config.ts` y `package.json`; `USER node`; `EXPOSE 3000`; `HEALTHCHECK` contra `http://localhost:3000/health` (usen `node -e "fetch(...)"`, la imagen slim no trae `curl`); `CMD ["node", "dist/main"]` (o `dist/src/main` según el `rootDir` de su tsconfig; verifíquenlo tras el primer build).

**`docker-compose.yml` (local)**: `postgres:18.6-bookworm` con volumen en `/var/lib/postgresql`, servicio `migrate` (misma imagen, `command: npx prisma migrate deploy`, `depends_on: db: condition: service_healthy`), `app` (`depends_on: migrate: condition: service_completed_successfully`) y `localstack` para SNS.

### ✅ Verificación de la fase 2

- [ ] `npm run build` compila sin errores.
- [ ] `docker compose up` levanta la app y `http://localhost:3000/docs` muestra los 5 endpoints.
- [ ] `GET /health` responde 200 con la BD arriba y 503 si se detiene Postgres.
- [ ] Ningún import de `infrastructure` dentro de `api` o `domain`.

---

## 3. Pruebas base y cobertura ≥ 80 %

### 3.1 Qué pruebas trae el arquetipo

Un `*.spec.ts` al lado de cada componente, con mocks de Jest (los convenios prohíben depender de BD, SNS u otros servicios en las pruebas unitarias):

| Componente | Qué verifica la prueba base |
|---|---|
| `IncidentsController` | Que delega en `IncidentService` y que los 501 salen con el formato estándar |
| `IncidentEventFactory` | `minor` → `minor_incident_reported_event`, `severe` → `severe_incident_reported_event`, sobre completo |
| `GlobalExceptionFilter` | `{code, message, timestamp, path}` y `errors[]` en 400 |
| `CorrelationIdMiddleware` | Propaga la cabecera o genera UUID |
| `JwtPayloadMiddleware` | Decodifica `sub`, `cognito:groups`, `custom:driver_id`; tolera token ausente o mal formado |
| `AssignmentsHttpClient` / `VehiclesHttpClient` | Mapeo de respuesta, 404, timeout → `dependency_unavailable` |
| `SnsEventPublisher` | Llama a `PublishCommand` con el atributo `event_type` |
| `OutboxPublisher` | Marca publicado con `message_id`; ante fallo incrementa `attempts` |
| `HealthController` | 200 / 503 según el indicador |
| DTO | Casos válidos e inválidos con `class-validator` |

### 3.2 Configuración de Jest (lo esencial)

- `testRegex: '.*\\.spec\\.ts$'`, `rootDir: 'src'`, `transform` con `ts-jest`.
- `coverageDirectory: '../coverage'` y `coverageReporters: ['text', 'lcov']` → genera `coverage/lcov.info`, que es lo que lee SonarCloud.
- `collectCoverageFrom` excluyendo lo que no tiene lógica: `main.ts`, `*.module.ts`, `generated/**`, `*.dto.ts` (opcional), `index.ts`.
- **Umbral:**
  ```
  coverageThreshold:
    global:            { lines: 80, branches: 80, functions: 80, statements: 80 }
    './src/**/domain/':      { lines: 100 }   ← exigencia del DAS (Completitud funcional)
    './src/**/application/': { lines: 100 }
  ```
  Si el arquetipo deja `application` con stubs `501`, el 100 % se cumple probando esos stubs; cuando escriban la lógica real, las HU deben traer sus pruebas para no romper el umbral.

> Las exclusiones de cobertura de Jest y las de SonarCloud (`sonar.coverage.exclusions`, sección 5) **deben coincidir**; si no, Jest dirá 85 % y Sonar 70 %.

### ✅ Verificación de la fase 3

- [ ] `npm run test:cov` pasa y muestra ≥ 80 % global.
- [ ] Existe `coverage/lcov.info` tras correrlo.
- [ ] Ninguna prueba necesita Postgres, LocalStack ni red.

---

## 4. Integración continua (CI) en `develop`

### 4.1 Qué hace el pipeline

Archivo `.github/workflows/ci.yml`. Se dispara en:

- `pull_request` hacia `develop` y `main` (tipos `opened`, `synchronize`, `reopened`).
- `push` a `develop` (para que SonarCloud tenga el análisis de la rama larga y calcule el "código nuevo" de los PR).

Dos jobs con **nombres fijos** (los nombres se usan luego en los rulesets como checks requeridos, sección 7):

| Job (`name:`) | Pasos |
|---|---|
| `build-and-test` | checkout → setup-node 24 con caché npm → `npm ci` → `npx prisma generate` → `npm run lint` → `npm run build` → `npm run test:ci` → subir `coverage/` como artefacto |
| `sonarcloud` | `needs: build-and-test` → checkout con `fetch-depth: 0` → descargar el artefacto `coverage/` → `SonarSource/sonarqube-scan-action@v8` con `SONAR_TOKEN` |

### 4.2 Plantilla de referencia

```yaml
name: CI

on:
  pull_request:
    branches: [develop, main]
    types: [opened, synchronize, reopened]
  push:
    branches: [develop]

concurrency:
  group: ci-${{ github.ref }}
  cancel-in-progress: true

permissions:
  contents: read
  pull-requests: read

jobs:
  build-and-test:
    name: build-and-test
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v7
      - uses: actions/setup-node@v7
        with:
          node-version: 24
          cache: npm
      - run: npm ci
      - run: npx prisma generate
      - run: npm run lint
      - run: npm run build
      - run: npm run test:ci
      - uses: actions/upload-artifact@v7
        with:
          name: coverage
          path: coverage/
          retention-days: 7

  sonarcloud:
    name: sonarcloud
    needs: build-and-test
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v7
        with:
          fetch-depth: 0          # obligatorio: Sonar necesita el historial para blame y código nuevo
      - uses: actions/download-artifact@v8
        with:
          name: coverage
          path: coverage/
      - uses: SonarSource/sonarqube-scan-action@v8
        env:
          SONAR_TOKEN: ${{ secrets.SONAR_TOKEN }}
```

Notas:
- `npx prisma generate` no necesita una BD real; si el `prisma.config.ts` exige `DATABASE_URL`, definan en el job `env: DATABASE_URL: postgresql://ci:ci@localhost:5432/ci`.
- Las versiones de las actions (`checkout@v7`, `setup-node@v7`, `upload-artifact@v7`, `download-artifact@v8`, `sonarqube-scan-action@v8`) son las mayores vigentes al 28/10/2026.
- El análisis del PR (decoración con comentario de Sonar) funciona solo con PR desde ramas del mismo repo, no desde forks (los forks no reciben secretos). Todo el equipo debe trabajar con ramas en el repo, no con forks.

### 4.3 Orden recomendado para activarlo

1. Rama `ci/pipeline` desde `develop` con `ci.yml`, `sonar-project.properties` y el `SONAR_TOKEN` ya configurado (sección 5).
2. Abrir PR hacia `develop` → el pipeline corre por primera vez. Debe quedar verde.
3. Fusionar. **Solo después** de que los checks hayan corrido al menos una vez aparecen para elegirlos en los rulesets (sección 7).

### ✅ Verificación de la fase 4

- [ ] Un PR hacia `develop` dispara `build-and-test` y `sonarcloud`.
- [ ] Si se rompe una prueba a propósito, el check queda en rojo.

---

## 5. SonarCloud

### 5.1 Alta del proyecto

1. Entrar a <https://sonarcloud.io> con **Log in with GitHub**.
2. **+ → Analyze new project → Import an organization**: elegir la organización de GitHub del curso e instalar la app de SonarCloud **solo** en el repo `fleetops-incident` (no en toda la organización si no son admins de ella; si no tienen permiso, un admin de la org de GitHub debe aprobar la instalación).
3. Plan **Free** (repos públicos).
4. Seleccionar el repo → **Set up**.
5. **Definición de código nuevo**: elegir **Previous version** o **Number of days = 30**. Con "Previous version", el `sonar.projectVersion` del properties marca los cortes.
6. Método de análisis: **With GitHub Actions** (CI-based).

### 5.2 Desactivar el análisis automático (paso crítico)

**Administration → Analysis Method → Automatic Analysis: OFF.**
Con el análisis automático encendido, SonarCloud **no importa cobertura** y el scan del pipeline falla con un error de "análisis automático habilitado". La cobertura solo llega por el análisis desde CI.

### 5.3 Token y secreto

1. SonarCloud → **My Account → Security → Generate token** (nombre `fleetops-incident-ci`, tipo de proyecto o de usuario).
2. GitHub → repo → **Settings → Secrets and variables → Actions → New repository secret**: `SONAR_TOKEN` = el token.

### 5.4 `sonar-project.properties` (raíz del repo)

```properties
sonar.organization=<org-en-sonarcloud>
sonar.projectKey=<org-en-sonarcloud>_fleetops-incident
sonar.projectName=FleetOps · Incident Service (G5)
sonar.projectVersion=0.1.0

sonar.sources=src
sonar.tests=src,test
sonar.test.inclusions=**/*.spec.ts,**/*.e2e-spec.ts
sonar.exclusions=**/generated/**,**/node_modules/**,dist/**,coverage/**

# Cobertura generada por Jest (mismo criterio de exclusión que collectCoverageFrom)
sonar.javascript.lcov.reportPaths=coverage/lcov.info
sonar.coverage.exclusions=src/main.ts,**/*.module.ts,**/generated/**,**/*.dto.ts,**/index.ts

# Duplicación: los DTO y decoradores de Swagger suelen marcarse como duplicados
sonar.cpd.exclusions=**/*.dto.ts

sonar.sourceEncoding=UTF-8
# El job falla si el Quality Gate no aprueba (así el PR queda bloqueado por el check "sonarcloud")
sonar.qualitygate.wait=true
```

`projectKey` y `organization` se copian de **Project Information** en SonarCloud; no los inventen.

### 5.5 Quality Gate

El gate por defecto **Sonar way** ya exige, sobre el código nuevo: cobertura ≥ 80 %, duplicación ≤ 3 %, 0 issues nuevos de severidad alta y todos los *security hotspots* revisados. Coincide con el requisito del curso, así que no hace falta crear uno propio. (Si el profesor pide otro umbral, se crea un gate nuevo en la organización y se asigna al proyecto en **Administration → Quality Gate**.)

Ojo: en el plan gratuito el gate aplica sobre **código nuevo**. El primer análisis de `develop` es la línea base; desde ahí cada PR se mide contra él.

### 5.6 Cómo resolver lo que reporte Sonar (proceso)

1. Abrir el PR → en la pestaña **Checks** o en el comentario de SonarCloud, entrar a **Issues** del análisis del PR.
2. Corregir por prioridad: **Security / Reliability** (bugs) → **Security Hotspots** (revisar y marcar *Safe* o corregir) → **Maintainability** (code smells).
3. Issues típicos en NestJS/TypeScript y cómo resolverlos:

| Issue frecuente | Solución |
|---|---|
| Propiedad inyectada no `readonly` | `constructor(private readonly service: IncidentService)` |
| Funciones con complejidad cognitiva alta | Extraer pasos de la cadena de validación en validadores separados (Chain of Responsibility, ya previsto en el DAS) |
| `TODO` sin resolver | Referenciar la HU: `// TODO(HU_FLEETOPS_INC_03): ...`; se aceptan en el arquetipo pero deben desaparecer al cerrar la HU |
| Hotspot "hard-coded credentials" en `.env.example` o compose | Usar valores obviamente de ejemplo y marcar el hotspot como *Safe* con justificación |
| Hotspot "permissive CORS" | No habilitar CORS abierto: las llamadas llegan por el API Gateway |
| Hotspot sobre `Math.random` | Usar `crypto.randomUUID()` para IDs |
| Duplicación en DTO/Swagger | Ya excluida con `sonar.cpd.exclusions` |
| Cobertura insuficiente en código nuevo | Agregar `.spec.ts` del componente nuevo en el mismo PR |
| Promesas sin `await` o sin manejo | `await` o `void` explícito + `catch` con log |

4. Hacer push al mismo PR → el pipeline vuelve a analizar → gate verde → se puede fusionar.
5. Un issue que sea falso positivo se marca **Accept** o **False positive** en SonarCloud con un comentario; nunca se silencia excluyendo la carpeta completa.

### 5.7 Badge (opcional)

En **Information → Get project badges** copien el badge de Quality Gate y cobertura al `README.md`.

### ✅ Verificación de la fase 5

- [ ] Automatic Analysis en **OFF**.
- [ ] El primer análisis de `develop` muestra cobertura (no "—").
- [ ] Un PR muestra el comentario/decoración de SonarCloud con el Quality Gate.
- [ ] Si se baja la cobertura a propósito, el check `sonarcloud` queda en rojo.

---

## 6. Qodo (revisor con IA, opcional)

Qodo es el segundo revisor de código: comenta cada PR con un resumen, posibles bugs y sugerencias. Es **complementario** a SonarCloud y **no** se pone como check requerido (si el servicio de IA falla, no debe bloquear al equipo).

Hay dos caminos; elijan uno.

### Opción A — App hospedada de Qodo (la más simple)

1. Entrar a <https://www.qodo.ai> → sección para open source (Qodo ofrece una versión gratuita para proyectos open source / repos públicos).
2. Iniciar sesión con GitHub e instalar la app de Qodo **solo en el repo** `fleetops-incident`.
3. Abrir un PR de prueba: Qodo debe comentar automáticamente.
4. Si el repo es privado, revisen si el plan gratuito aplica; si no, usen la opción B.

### Opción B — PR-Agent (open source) como GitHub Action con su propia API key

PR-Agent es el proyecto open source que Qodo donó a la comunidad. Corre dentro de GitHub Actions y usa la API key del modelo que ustedes elijan. Para estudiantes, la opción más barata es una key de **Google AI Studio** (Gemini), que tiene capa gratuita.

1. Crear la API key (Google AI Studio u OpenAI).
2. Secreto en GitHub: `GEMINI_API_KEY` (o `OPENAI_KEY`).
3. `.github/workflows/pr-agent.yml`:

```yaml
name: PR Agent (Qodo)

on:
  pull_request:
    types: [opened, reopened, ready_for_review, synchronize]
  issue_comment:

jobs:
  pr_agent:
    if: ${{ github.event.sender.type != 'Bot' }}
    runs-on: ubuntu-latest
    permissions:
      contents: read
      issues: write
      pull-requests: write
    steps:
      - name: PR Agent
        uses: the-pr-agent/pr-agent@main
        env:
          GITHUB_TOKEN: ${{ secrets.GITHUB_TOKEN }}
          GOOGLE_AI_STUDIO.GEMINI_API_KEY: ${{ secrets.GEMINI_API_KEY }}
          github_action_config.auto_review: "true"
          github_action_config.auto_describe: "true"
          github_action_config.auto_improve: "true"
```

4. `.pr_agent.toml` en la raíz (se lee desde la **rama por defecto**, o sea `develop`; hay que fusionarlo antes de que surta efecto):

```toml
[config]
model = "gemini/gemini-3.8-flash"
fallback_models = ["gemini/gemini-3.8-flash"]
response_language = "es-CO"

[pr_reviewer]
require_tests_review = true
extra_instructions = """
Revisa contra el DAS v3.0 del microservicio de Incidentes:
- api -> application -> domain; infrastructure solo implementa puertos.
- Contratos en inglés y snake_case; fechas ISO 8601 con offset -05:00; IDs UUID.
- Errores {code, message, timestamp, path, errors}; paginación {content, page, size, total}.
- Pruebas unitarias con mocks (sin BD, SNS ni red).
"""

[pr_code_suggestions]
extra_instructions = "Prioriza bugs, seguridad y violaciones de las capas del DAS sobre estilo."
```

Antes de usarlo, confirmen el nombre exacto del modelo disponible en su cuenta (cambian seguido) y ajústenlo en `model`.

5. Comandos útiles que se escriben como comentario en el PR: `/review`, `/describe`, `/improve`, `/ask "¿esto respeta el ADR-02?"`.

### Cómo usar a Qodo en el proceso

- Sus comentarios son **sugerencias**: el autor del PR responde cada una (aplicar o justificar por qué no).
- No reemplaza la aprobación humana exigida por el ruleset.

### ✅ Verificación de la fase 6

- [ ] Un PR de prueba recibe el comentario de Qodo (app o action) en español.
- [ ] El check de Qodo **no** está marcado como requerido.

---

## 7. Rulesets de las ramas

Se configuran en **Settings → Rules → Rulesets → New ruleset → New branch ruleset**. Requiere rol Admin. Háganlo **después** de que la CI haya corrido al menos una vez (sección 4.3), para que los checks aparezcan en el buscador.

### 7.1 Ruleset `protect-main`

| Campo | Valor |
|---|---|
| Enforcement status | **Active** |
| Bypass list | Vacía (o solo el líder técnico para emergencias; documentarlo) |
| Target branches | **Include default branch**: no; **Include by pattern**: `main` |
| Restrict deletions | ✅ |
| Block force pushes | ✅ |
| Require linear history | ✅ (coherente con squash merge) |
| Require a pull request before merging | ✅ — Required approvals: **2** · Dismiss stale approvals on new push ✅ · Require conversation resolution ✅ · Allowed merge methods: **Squash** |
| Require status checks to pass | ✅ — agregar `build-and-test` y `sonarcloud` · *Require branches to be up to date* ✅ |
| Restrict creations / updates | No |

### 7.2 Ruleset `protect-develop`

Igual que `main`, con estas diferencias:

- Target: `develop`.
- Required approvals: **1**.
- Checks requeridos: `build-and-test` y `sonarcloud`.
- *Require branches to be up to date*: opcional (si el equipo es pequeño, actívenlo; evita fusionar sobre una base vieja).

### 7.3 (Opcional) Ruleset de nombres de rama

Ruleset sobre `refs/heads/*` excluyendo `main` y `develop`, con la regla **Restrict branch names** (si su plan la tiene) y patrón `^(feature|hotfix|chore|ci|docs)\/.+`. Si no está disponible en su plan, se maneja como acuerdo del equipo.

### 7.4 Exportar los rulesets al repo

Cada ruleset tiene **Export** (JSON). Guarden los JSON en `docs/rulesets/` para evidencia del curso y para reimportarlos con **Import a ruleset** si se recrea el repo.

### ✅ Verificación de la fase 7

- [ ] `git push origin main` directo es rechazado.
- [ ] Un PR a `develop` con un check en rojo no muestra el botón de merge habilitado.
- [ ] Los JSON exportados están en `docs/rulesets/`.

---

## 8. Docker Hub

1. Crear cuenta (o una organización del equipo) en <https://hub.docker.com>.
2. **Create repository**: `fleetops-incident`, visibilidad **Public** (las imágenes no deben contener secretos; toda la configuración entra por variables de entorno).
3. **Account settings → Personal access tokens → Generate new token**: nombre `github-actions-fleetops-incident`, permisos **Read & Write**.
4. Secretos en GitHub:
   - `DOCKERHUB_USERNAME` = usuario u organización de Docker Hub.
   - `DOCKERHUB_TOKEN` = el token (nunca la contraseña).
5. Convención de tags que usará el CD:
   - `latest` → lo que corre en producción.
   - `sha-<7 caracteres>` → trazabilidad y rollback.

### ✅ Verificación de la fase 8

- [ ] Repo `fleetops-incident` creado en Docker Hub.
- [ ] Secretos `DOCKERHUB_USERNAME` y `DOCKERHUB_TOKEN` en GitHub.

---

## 9. Instancia EC2 en AWS

### 9.1 Crear la instancia

1. Consola AWS → región acordada por FleetOps (la misma del topic SNS; confirmen con los demás equipos, por ejemplo `us-east-1`).
2. **EC2 → Launch instance**:
   - Nombre: `fleetops-incident-prod`.
   - AMI: **Ubuntu Server 24.04 LTS** (x86_64).
   - Tipo: `t3.small` recomendado (Node + Postgres en la misma máquina); `t3.micro`/`t2.micro` funciona con poca carga si están en Free Tier.
   - Key pair: crear `fleetops-incident-key` (ED25519, `.pem`). **Guárdenla**: es la que irá como secreto de GitHub.
   - Almacenamiento: 20 GB gp3.
3. **Security group** `sg-fleetops-incident`:

| Puerto | Origen | Para qué |
|---|---|---|
| 22 (SSH) | Su IP + rango que use GitHub Actions* | Administración y despliegue |
| 3000 (app) | Por ahora `0.0.0.0/0` para revisar Swagger; luego solo el API Gateway y los security groups de FleetOps | API |
| 5432 | **Nunca abierto** | Postgres solo en la red interna de Docker |

\* Los runners de GitHub no tienen IP fija. Para el curso es aceptable abrir 22 a `0.0.0.0/0` **solo con autenticación por llave** (Ubuntu ya desactiva contraseñas). La alternativa más segura es desplegar con AWS Systems Manager (SSM) en vez de SSH; si el profesor lo pide, se cambia el paso de despliegue.

4. **Elastic IP**: *Allocate* y *Associate* a la instancia, para que la IP no cambie al reiniciar (el secreto `EC2_HOST` depende de esto).
5. **IAM role** (para la HU de eventos, no bloquea el setup): rol `fleetops-incident-ec2` con una política que permita solo `sns:Publish` sobre el ARN de `incident-events` (DAS, Integración segura). Se asocia en **Actions → Security → Modify IAM role**.

### 9.2 Preparar el servidor

```bash
ssh -i fleetops-incident-key.pem ubuntu@<ELASTIC_IP>

# Docker Engine + Compose plugin (script oficial de Docker)
curl -fsSL https://get.docker.com | sudo sh
sudo usermod -aG docker ubuntu
exit            # salir y volver a entrar para que aplique el grupo
ssh -i fleetops-incident-key.pem ubuntu@<ELASTIC_IP>
docker version && docker compose version

# Carpeta del servicio
sudo mkdir -p /opt/fleetops-incident && sudo chown ubuntu:ubuntu /opt/fleetops-incident
cd /opt/fleetops-incident
```

### 9.3 Archivos en el servidor

En `/opt/fleetops-incident` deben quedar **dos** archivos (no se clona el repo en el servidor):

**`.env`** (permisos `chmod 600 .env`), con valores reales de producción: `DATABASE_URL` apuntando al servicio `db` del compose, `POSTGRES_USER/PASSWORD/DB`, URLs de Asignaciones y Vehículos, `SNS_TOPIC_ARN`, `AWS_REGION`, `SWAGGER_ENABLED=true`, `TZ=America/Bogota`. Sin `AWS_ENDPOINT_URL` (en EC2 se usa SNS real con el IAM role, sin llaves).

**`docker-compose.prod.yml`**, con esta forma:

```yaml
services:
  db:
    image: postgres:18.6-bookworm
    restart: unless-stopped
    env_file: .env
    volumes:
      - pgdata:/var/lib/postgresql
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U $${POSTGRES_USER} -d $${POSTGRES_DB}"]
      interval: 5s
      retries: 10

  migrate:
    image: ${DOCKERHUB_USERNAME}/fleetops-incident:latest
    env_file: .env
    command: ["npx", "prisma", "migrate", "deploy"]
    depends_on:
      db:
        condition: service_healthy
    restart: "no"

  app:
    image: ${DOCKERHUB_USERNAME}/fleetops-incident:latest
    restart: unless-stopped
    env_file: .env
    ports:
      - "3000:3000"
    depends_on:
      migrate:
        condition: service_completed_successfully
    deploy:
      resources:
        limits:
          cpus: "1.0"
          memory: 512M

volumes:
  pgdata:
```

(`DOCKERHUB_USERNAME` también va en el `.env` para que Compose lo interpole.) Este archivo vive también en el repo como `docker-compose.prod.yml`; si cambia, el CD lo copia al servidor (paso 10.2) o se actualiza a mano.

### 9.4 Primer arranque manual (antes de automatizar)

Cuando ya exista una imagen en Docker Hub (puede ser un `docker build` + `docker push` manual desde un portátil la primera vez):

```bash
cd /opt/fleetops-incident
docker compose -f docker-compose.prod.yml pull
docker compose -f docker-compose.prod.yml up -d
docker compose -f docker-compose.prod.yml ps        # migrate: Exited (0); app y db: healthy
curl -s http://localhost:3000/health
```

### ✅ Verificación de la fase 9

- [ ] Elastic IP asociada.
- [ ] `docker compose version` funciona sin `sudo`.
- [ ] `.env` con permisos 600 y fuera de cualquier repo.
- [ ] `http://<ELASTIC_IP>:3000/docs` abre Swagger tras el arranque manual.

---

## 10. Despliegue continuo (CD) desde `main`

### 10.1 Secretos adicionales en GitHub

| Secreto | Valor |
|---|---|
| `EC2_HOST` | Elastic IP |
| `EC2_USER` | `ubuntu` |
| `EC2_SSH_KEY` | Contenido completo del `.pem` (incluidas las líneas `-----BEGIN…` y `-----END…`) |

Recomendado: crear un **Environment** `production` (**Settings → Environments**) y guardar ahí estos secretos, con *Deployment branches: main only*. Así ningún workflow de otra rama puede leerlos.

### 10.2 Qué hace `.github/workflows/cd.yml`

Disparadores: `push` a `main` y `workflow_dispatch` (para redesplegar a mano).

| Job | Pasos |
|---|---|
| `build-and-push` | checkout → `docker/setup-buildx-action@v4` → `docker/login-action@v4` (Docker Hub) → `docker/metadata-action@v6` (tags `latest` y `sha-xxxxxxx`) → `docker/build-push-action@v7` con `push: true` y caché de GitHub Actions |
| `deploy` | `needs: build-and-push`, `environment: production` → (opcional) copiar `docker-compose.prod.yml` al servidor → `appleboy/ssh-action@v1` ejecuta en EC2: `docker compose pull`, `docker compose up -d`, `docker image prune -f` → verificación de `GET /health` con reintentos; si no responde 200, el job falla |

Plantilla de referencia:

```yaml
name: CD

on:
  push:
    branches: [main]
  workflow_dispatch:

concurrency:
  group: cd-production
  cancel-in-progress: false

jobs:
  build-and-push:
    name: build-and-push
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v7
      - uses: docker/setup-buildx-action@v4
      - uses: docker/login-action@v4
        with:
          username: ${{ secrets.DOCKERHUB_USERNAME }}
          password: ${{ secrets.DOCKERHUB_TOKEN }}
      - id: meta
        uses: docker/metadata-action@v6
        with:
          images: ${{ secrets.DOCKERHUB_USERNAME }}/fleetops-incident
          tags: |
            type=raw,value=latest
            type=sha,prefix=sha-
      - uses: docker/build-push-action@v7
        with:
          context: .
          push: true
          tags: ${{ steps.meta.outputs.tags }}
          labels: ${{ steps.meta.outputs.labels }}
          cache-from: type=gha
          cache-to: type=gha,mode=max

  deploy:
    name: deploy
    needs: build-and-push
    runs-on: ubuntu-latest
    environment: production
    steps:
      - uses: appleboy/ssh-action@v1
        with:
          host: ${{ secrets.EC2_HOST }}
          username: ${{ secrets.EC2_USER }}
          key: ${{ secrets.EC2_SSH_KEY }}
          script: |
            set -e
            cd /opt/fleetops-incident
            docker compose -f docker-compose.prod.yml pull
            docker compose -f docker-compose.prod.yml up -d --remove-orphans
            docker image prune -f
            for i in $(seq 1 20); do
              if curl -fsS http://localhost:3000/health > /dev/null; then echo "healthy"; exit 0; fi
              sleep 5
            done
            echo "El servicio no respondió /health" && docker compose -f docker-compose.prod.yml logs --tail=100 app && exit 1
```

### 10.3 Rollback

Si un despliegue sale mal: en el servidor, cambiar temporalmente en el compose `:latest` por el tag `sha-xxxxxxx` anterior (está en Docker Hub) y `docker compose up -d`. Luego corregir en `develop` y volver a liberar. Nunca se hace push directo a `main` para "arreglar rápido": va por `hotfix/*` + PR.

### ✅ Verificación de la fase 10

- [ ] Al fusionar un PR en `main`, el workflow CD corre completo.
- [ ] En Docker Hub aparecen los tags `latest` y `sha-…` nuevos.
- [ ] El job `deploy` termina con "healthy".

---

## 11. Verificación end-to-end (Swagger, health, metrics)

Después del primer release `develop → main`:

| Prueba | Resultado esperado |
|---|---|
| `http://<ELASTIC_IP>:3000/docs` | Swagger UI con `POST /incidents`, `GET /incidents/{id}`, `GET /incidents`, `/health`, `/metrics` |
| `GET /health` | `200` con `{"status":"ok", ... "database": {"status":"up"}}` |
| `GET /metrics` | Texto en formato Prometheus |
| `POST /incidents` desde Swagger | `501` con `{code: "not_implemented", message, timestamp, path}` y cabecera `X-Correlation-Id` |
| Body inválido en `POST /incidents` | `400` con `errors[]` (si el `ValidationPipe` ya está activo en el arquetipo) |
| `docker compose ps` en EC2 | `app` y `db` *healthy*, `migrate` *Exited (0)* |
| SonarCloud → rama `main` | Quality Gate **Passed** y cobertura ≥ 80 % |

Tomen capturas de esta tabla: son la evidencia de "servicio corriendo con documentación" para la entrega.

---

## 12. Proceso de desarrollo del día a día

### 12.1 Ciclo de una historia de usuario

1. Tomar la HU del backlog (`HU_FLEETOPS_INC_xx`) y moverla a *In progress*.
2. `git checkout develop && git pull` → `git checkout -b feature/HU_FLEETOPS_INC_xx-descripcion`.
3. Desarrollar respetando las capas y escribiendo las pruebas **en el mismo PR** (la cobertura de código nuevo se mide por PR).
4. Antes de abrir el PR, localmente: `npm run lint && npm run build && npm run test:cov`.
5. Abrir PR hacia `develop` usando la plantilla (12.2). Asignar un revisor.
6. Esperar: `build-and-test` ✅ · `sonarcloud` ✅ · comentarios de Qodo respondidos · 1 aprobación.
7. **Squash and merge**. La rama se borra sola.
8. Mover la HU a *Done* solo si sus criterios de aceptación tienen prueba.

### 12.2 Plantilla de PR (`.github/pull_request_template.md`)

```markdown
## HU
HU_FLEETOPS_INC_xx — <título>

## Qué cambia
-

## Capas tocadas
- [ ] api  - [ ] application  - [ ] domain  - [ ] infrastructure  - [ ] shared

## Checklist
- [ ] Contratos en inglés y snake_case; fechas con offset -05:00
- [ ] Pruebas unitarias nuevas/actualizadas (sin BD ni red)
- [ ] Swagger actualizado (DTO, ejemplos, códigos de respuesta)
- [ ] Sin secretos en el código ni en .env.example
- [ ] Issues de SonarCloud del PR resueltos o justificados
- [ ] Comentarios de Qodo atendidos
```

### 12.3 Release a producción

1. Cuando `develop` tenga un incremento estable, abrir PR `develop → main` titulado `release: vX.Y.Z`.
2. Actualizar `version` en `package.json` y `sonar.projectVersion` (eso mueve el "código nuevo" de Sonar si usan *Previous version*).
3. Dos aprobaciones + checks verdes → squash merge → el CD despliega solo.
4. Verificar con la tabla de la sección 11.

### 12.4 Pendientes de coordinación antes de las primeras HU

Vienen de la sección 2.3 del DAS y del catálogo de endpoints:

- Actualizar en `FleetOps_Endpoints_y_Eventos` la fila de Incidentes: el catálogo aún muestra `/incidentes`, campos en español y `IncidenteReportadoEvent`; debe quedar `/incidents`, `snake_case` en inglés y los eventos `minor_incident_reported_event` / `severe_incident_reported_event`.
- Confirmar con Vehículos la ruta definitiva (`GET /vehicles/{id}`) y con Asignaciones los nombres de estados en inglés (`in_progress`, etc.). Mientras tanto, las URLs van por variable de entorno.
- Publicar el OpenAPI (`/docs-json`) y un JSON de ejemplo de cada evento en `fleetops-contracts` por PR.
- Confirmar región AWS y quién crea el topic `incident-events` y las suscripciones.

---

## 13. Problemas frecuentes

| Síntoma | Causa probable | Solución |
|---|---|---|
| El scan de Sonar falla diciendo que el análisis automático está activo | Automatic Analysis en ON | Apagarlo (5.2) |
| Sonar muestra cobertura 0 % o "—" | No encuentra `coverage/lcov.info` | Verificar `coverageReporters: ['lcov']`, que el artefacto se descargue en `coverage/` y la ruta en `sonar.javascript.lcov.reportPaths` |
| Jest dice 85 % y Sonar 70 % | Exclusiones distintas | Igualar `collectCoverageFrom` y `sonar.coverage.exclusions` |
| "Shallow clone detected" en Sonar | Falta `fetch-depth: 0` | Agregarlo al checkout del job `sonarcloud` |
| No aparecen los checks al crear el ruleset | El workflow nunca ha corrido | Abrir un PR para que corra una vez (4.3) |
| `ts-jest` falla con TypeScript 7 | Se instaló `typescript@latest` | Fijar `typescript@~6.0` |
| `prisma generate` o el build fallan con Prisma 8 | Se instaló `prisma@latest` (8 RC) | Fijar `prisma@^7` y `@prisma/client@^7` |
| `Cannot find module '../generated/prisma'` | No se corrió `prisma generate` | Agregarlo al pipeline, al Dockerfile y a `prebuild` |
| El contenedor `migrate` falla con "prisma: not found" | La CLI quedó en devDependencies y se podó | Mover `prisma` a `dependencies` |
| `app` no arranca en EC2 | `migrate` terminó con error | `docker compose logs migrate`; revisar `DATABASE_URL` (host `db`, no `localhost`) |
| `appleboy/ssh-action` da timeout | Puerto 22 cerrado para los runners | Revisar el security group (9.1) |
| `permission denied` de Docker en EC2 | Usuario fuera del grupo `docker` | `sudo usermod -aG docker ubuntu` y reconectar |
| Swagger no abre desde el navegador | Puerto 3000 cerrado o `SWAGGER_ENABLED=false` | Security group / `.env` |
| Qodo/PR-Agent no comenta | Falta el secreto o `.pr_agent.toml` no está en la rama por defecto | Revisar secretos y fusionar el toml a `develop` |

---

## 14. Anexos

### 14.1 Secretos de GitHub

| Secreto | Dónde | Usado por |
|---|---|---|
| `SONAR_TOKEN` | Repository secrets | CI (`sonarcloud`) |
| `GEMINI_API_KEY` u `OPENAI_KEY` | Repository secrets | PR-Agent (solo opción B) |
| `DOCKERHUB_USERNAME` | Repository secrets | CD |
| `DOCKERHUB_TOKEN` | Repository secrets | CD |
| `EC2_HOST` | Environment `production` | CD (`deploy`) |
| `EC2_USER` | Environment `production` | CD (`deploy`) |
| `EC2_SSH_KEY` | Environment `production` | CD (`deploy`) |

### 14.2 Checklist final del setup (para la entrega)

- [ ] Repo con `main` y `develop`, squash merge y rulesets activos (JSON en `docs/rulesets/`).
- [ ] Arquetipo con todas las capas del DAS, dependencias conectadas y Swagger en `/docs`.
- [ ] Pruebas base con cobertura ≥ 80 % (100 % en `domain` y `application`).
- [ ] CI corriendo en cada PR a `develop` (build, lint, tests, cobertura).
- [ ] SonarCloud con cobertura importada y Quality Gate bloqueando el merge.
- [ ] Qodo comentando los PR (opcional).
- [ ] Imagen publicada en Docker Hub por el pipeline de `main`.
- [ ] EC2 con Elastic IP, Docker, `.env` y `docker-compose.prod.yml`.
- [ ] CD desplegando automáticamente y validando `/health`.
- [ ] Evidencia: capturas de Swagger en EC2, Quality Gate y checks de un PR.

### 14.3 Orden de trabajo sugerido para el equipo

| Paso | Responsable sugerido | Depende de |
|---|---|---|
| 1. Repo, ramas, accesos | Líder técnico | — |
| 2. SonarCloud + secreto | Líder técnico | 1 |
| 3. Arquetipo (rama `chore/archetype`) | 2 integrantes | 1 |
| 4. Pruebas base | 1 integrante | 3 |
| 5. `ci.yml` + `sonar-project.properties` | 1 integrante | 2 |
| 6. Qodo | Líder técnico | 1 |
| 7. Rulesets | Líder técnico | 5 corrido una vez |
| 8. Docker Hub + Dockerfile + compose | 1 integrante | 3 |
| 9. EC2 | 1 integrante con la cuenta AWS | — (en paralelo) |
| 10. `cd.yml` + primer release | Líder técnico | 8, 9 |

### 14.4 Referencias

- DAS v3.0 del microservicio de Incidentes y Convenios de FleetOps v2.0 (carpeta `docs/` del repo).
- SonarQube Scan Action (SonarCloud y Server): <https://github.com/SonarSource/sonarqube-scan-action>
- Documentación de SonarQube Cloud para JavaScript/TypeScript y cobertura: <https://docs.sonarsource.com/sonarqube-cloud/>
- PR-Agent (proyecto open source donado por Qodo): <https://github.com/qodo-ai/pr-agent> · Qodo para open source: <https://www.qodo.ai/solutions/open-source/>
- Rulesets de GitHub: <https://docs.github.com/repositories/configuring-branches-and-merges-in-your-repository/managing-rulesets>
- Docker build-push-action: <https://github.com/docker/build-push-action>
- appleboy/ssh-action: <https://github.com/appleboy/ssh-action>
