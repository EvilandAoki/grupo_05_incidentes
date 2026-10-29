-- Migración inicial del microservicio de Incidentes (PostgreSQL 18) – versión 3.0 del DAS
-- Con Prisma Migrate este archivo es prisma/migrations/20261027000000_init/migration.sql.
-- Prisma no modela los CHECK: se mantienen aquí, en SQL. El índice parcial se declara
-- también en schema.prisma con el preview partialIndexes para que Prisma no lo elimine.

CREATE TABLE incidents (
    id            UUID          PRIMARY KEY,
    assignment_id UUID          NOT NULL,
    severity      VARCHAR(10)   NOT NULL,
    description   VARCHAR(2000) NOT NULL,
    status        VARCHAR(20)   NOT NULL DEFAULT 'reported',
    reported_at   TIMESTAMPTZ   NOT NULL,
    created_at    TIMESTAMPTZ   NOT NULL DEFAULT NOW(),

    CONSTRAINT ck_incidents_severity CHECK (severity IN ('minor', 'severe')),
    CONSTRAINT ck_incidents_status   CHECK (status IN ('reported'))
);

-- Índices para los filtros de GET /incidents
CREATE INDEX idx_incidents_assignment_id ON incidents (assignment_id);
CREATE INDEX idx_incidents_severity      ON incidents (severity);
CREATE INDEX idx_incidents_reported_at   ON incidents (reported_at DESC);

CREATE TABLE outbox_events (
    event_id        UUID          PRIMARY KEY,
    incident_id     UUID          NOT NULL REFERENCES incidents (id),
    event_type      VARCHAR(60)   NOT NULL,
    occurred_at     TIMESTAMPTZ   NOT NULL,
    source          VARCHAR(30)   NOT NULL DEFAULT 'incident',
    correlation_id  VARCHAR(64)   NOT NULL,
    data            JSONB         NOT NULL,
    attempts        INTEGER       NOT NULL DEFAULT 0,
    next_attempt_at TIMESTAMPTZ,
    last_error      VARCHAR(500),
    message_id      VARCHAR(100),
    published_at    TIMESTAMPTZ,

    CONSTRAINT ck_outbox_event_type CHECK (event_type IN ('minor_incident_reported_event', 'severe_incident_reported_event')),
    CONSTRAINT uq_outbox_incident   UNIQUE (incident_id)
);

-- Solo eventos pendientes de publicar (lectura de OutboxPublisher y métrica de pendientes)
CREATE INDEX idx_outbox_pending ON outbox_events (occurred_at) WHERE published_at IS NULL;
