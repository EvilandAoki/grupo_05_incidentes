# FleetOps · Incident Service (Grupo 5)

Microservicio de Incidentes. NestJS 12 (CommonJS) · TypeScript 6.0 · Prisma 7 · PostgreSQL 18 · Jest.
Este repositorio es el **arquetipo**: capas, configuración y endpoints existen, pero la lógica de negocio responde `501 not_implemented` hasta que se desarrollen las HU. La guía de proceso está en [`docs/GUIA_SETUP_FLEETOPS_INCIDENT.md`](docs/GUIA_SETUP_FLEETOPS_INCIDENT.md).

## Requisitos

- Node.js **24** (`.nvmrc`).
- **pnpm** (la guía menciona npm; el equipo usa pnpm). La versión está fijada en `package.json` (`packageManager`). Actívala con:

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
- Salud: `GET /health` (200 con la BD arriba, 503 si no responde) · Métricas: `GET /metrics`

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
