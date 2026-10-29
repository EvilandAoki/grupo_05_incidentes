# FleetOps · Incident Service (Grupo 5)

Microservicio de Incidentes. NestJS 12 (CommonJS) · TypeScript 6.0 · Prisma 7 · PostgreSQL 18 · Jest.
Este repositorio es el **arquetipo**: capas, configuración y endpoints existen, pero la lógica de negocio responde `501 not_implemented` hasta que se desarrollen las HU. La guía de proceso está en [`docs/GUIA_SETUP_FLEETOPS_INCIDENT.md`](docs/GUIA_SETUP_FLEETOPS_INCIDENT.md).

## Requisitos

- Node.js **24** (`.nvmrc`).
- **pnpm**. La versión está fijada en `package.json` (`packageManager`). Actívala con:

  ```bash
  corepack enable
  ```

## Puesta en marcha

```bash
pnpm install --frozen-lockfile
cp .env.example .env        # y poner la DATABASE_URL real de la BD de pruebas compartida
pnpm prisma:generate
pnpm start:dev
```

- Swagger: <http://localhost:3000/docs> · JSON del contrato: `/docs-json`
- Métricas: `GET /metrics` (incluye `http_request_duration_seconds` con labels `method`, `route`, `status_code`)
- Salud: `GET /health`

### Formato de `/health`

Es el de Terminus. Con la BD arriba responde `200`:

```json
{ "status": "ok", "info": { "database": { "status": "up" } }, "error": {}, "details": { "database": { "status": "up" } } }
```

Si `SELECT 1` falla, responde `503` con el formato estándar de errores del servicio
(`{"code": "dependency_unavailable", "message": "Service Unavailable Exception", "timestamp": …, "path": "/health"}`).
El cuerpo propio de Terminus (`"status": "error"`) solo se ve en los logs.

## Scripts

| Script | Qué hace |
|---|---|
| `pnpm build` | `prisma generate` + `nest build` |
| `pnpm start:dev` / `start:prod` | Arranque en desarrollo / sobre `dist/` |
| `pnpm lint` · `pnpm format` | ESLint 10 + typescript-eslint · Prettier |
| `pnpm test` · `test:cov` · `test:ci` | Pruebas unitarias · con cobertura · modo CI |
| `pnpm test:e2e` | Pruebas e2e (Prisma mockeado, no tocan la BD) |
| `pnpm prisma:migrate:deploy` · `prisma:migrate:status` | Migraciones contra la BD configurada |

**Linter:** ESLint 10 con `typescript-eslint` (configuración flat en `eslint.config.mjs`).

**Jest y paquetes ESM:** NestJS 12 se publica solo como ESM. En ejecución, Node 24 lo carga desde CommonJS sin flags. Jest lo necesita con `--experimental-vm-modules`, por eso los scripts de prueba llaman a Jest vía `node --experimental-vm-modules`. No ejecutes `jest` directamente: usa `pnpm test`.

**`tsconfig`:** `moduleResolution: node10` está deprecado en TS 6; se mantiene (ADR-03) con `ignoreDeprecations: "6.0"`. TypeScript 7 no es compatible, por eso va fijado `~6.0`.

## Pruebas

Las pruebas unitarias no necesitan BD, red ni SNS. Umbrales de cobertura: 80 % global y 100 % de líneas en `domain` y `application` (`jest.config.ts`).

Las pruebas `placeholder 501` solo sostienen la cobertura del arquetipo; cada HU debe borrar las suyas y reemplazarlas por pruebas del comportamiento real en el mismo PR.

## Variables de entorno

Se validan con Joi al arrancar (`src/shared/config/env.validation.ts`); la plantilla es `.env.example`.

| Variable | Regla | Por defecto |
|---|---|---|
| `DATABASE_URL` | URL `postgresql://` · **obligatoria** | — |
| `NODE_ENV`, `PORT`, `TZ`, `SWAGGER_ENABLED`, `LOG_LEVEL` | `LOG_LEVEL`: fatal, error, warn, info, debug, trace, silent | development, 3000, America/Bogota, true, info |
| `ASSIGNMENTS_BASE_URL`, `VEHICLES_BASE_URL` | URL http/https · **obligatorias en producción** | — |
| `HTTP_TIMEOUT_MS` | entero ≥ 100 | 3000 |
| `CIRCUIT_BREAKER_ERROR_THRESHOLD` | entero 1–100 | 50 |
| `CIRCUIT_BREAKER_RESET_TIMEOUT_MS` | entero ≥ 1000 | 10000 |
| `AWS_REGION` | texto | us-east-1 |
| `SNS_TOPIC_ARN` | `arn:aws:sns:<región>:<12 dígitos>:fleetops_incident_events` · **obligatoria en producción** | — |
| `AWS_ENDPOINT_URL` | URL o vacío; solo local con LocalStack | — |
| `OUTBOX_POLL_INTERVAL_MS` | entero ≥ 1000 | 5000 |

## LocalStack (SNS/SQS locales)

`docker compose up` levanta Postgres, la migración, la app y LocalStack (`localstack/localstack:4`, solo SNS y SQS, puerto 4566). El script `docker/localstack/init-aws.sh` (montado en `/etc/localstack/init/ready.d/`) crea:

- el topic `fleetops_incident_events`,
- la cola `incident_events_test_queue`,
- una suscripción SQS al topic con raw message delivery.

La app recibe `AWS_ENDPOINT_URL=http://localstack:4566`, `AWS_REGION`, `SNS_TOPIC_ARN` y credenciales ficticias. El script debe tener permiso de ejecución (`chmod +x`). Mientras `SnsEventPublisher` sea un stub (HU_FLEETOPS_INC_04), LocalStack queda disponible pero sin uso.

Para leer lo publicado en la cola de prueba:

```bash
docker compose exec localstack awslocal sqs receive-message \
  --queue-url http://sqs.us-east-1.localhost.localstack.cloud:4566/000000000000/incident_events_test_queue
```

## Estructura (ADR-02)

`api → application → domain`; `infrastructure` implementa los puertos de `application`. Un controlador nunca importa de `infrastructure`.

```
src/incidents/{api,application,domain,infrastructure}   · lógica del servicio
src/shared                                              · Prisma, config, middlewares, filtro de errores
src/health · src/metrics                                · /health y /metrics
prisma/                                                 · schema y migraciones
```

Los componentes aún sin HU (clientes HTTP de Asignaciones y Vehículos, `SnsEventPublisher`, `OutboxPublisher`, `PrismaIncidentRepository`) son stubs marcados con `TODO(HU_FLEETOPS_INC_xx)`.

## Base de datos compartida

El equipo usa una BD de pruebas compartida. Su `DATABASE_URL` va **solo** en tu `.env` local (ignorado por git).

- Aplica migraciones **únicamente** con `pnpm prisma:migrate:deploy`.
- **Nunca** ejecutes `prisma migrate dev` ni `prisma migrate reset` contra esa BD: `reset` borra los datos de todos.
- Los CHECK de la BD viven solo en `prisma/migrations/*/migration.sql`; Prisma no los modela.
- Las pruebas unitarias y e2e no necesitan BD.

## Calidad: SonarCloud

Pasos manuales (los hace un admin del repo, guía §5):

1. Importar el repo en <https://sonarcloud.io> y desactivar **Administration → Analysis Method → Automatic Analysis**.
2. Copiar `organization` y `projectKey` a `sonar-project.properties` (hoy son placeholders `<org-en-sonarcloud>`).
3. Crear el secreto `SONAR_TOKEN` en GitHub (Settings → Secrets and variables → Actions).

Las exclusiones de cobertura de `jest.config.ts` y `sonar.coverage.exclusions` deben mantenerse iguales.

## CI / CD

- `.github/workflows/ci.yml`: en cada PR a `develop`/`main` y push a `develop`/`main` corre `build-and-test` (lint, build, pruebas con cobertura) y `sonarcloud`.
- `.github/workflows/cd.yml`: construye y publica la imagen en Docker Hub y despliega en EC2. **Está inactivo** hasta definir la variable de repositorio `CD_ENABLED=true` y los secretos de la guía §14.1.
- `Dockerfile`, `docker-compose.yml` (local) y `docker-compose.prod.yml` (EC2) siguen la guía §2.7 y §9.3.
