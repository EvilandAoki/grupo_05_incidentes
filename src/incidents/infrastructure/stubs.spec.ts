import { NotImplementedException } from '@nestjs/common';
import { Incident } from '../domain/incident';
import { Severity } from '../domain/severity';
import { AssignmentsHttpClient } from './assignments-http.client';
import { OutboxPublisher } from './outbox.publisher';
import { PrismaIncidentRepository } from './prisma-incident.repository';
import { SnsEventPublisher } from './sns-event.publisher';
import { VehiclesHttpClient } from './vehicles-http.client';

// Mientras las HU no los implementen, los componentes de infraestructura responden 501.
describe('placeholder 501 — borrar al implementar la HU', () => {
  const incident: Incident = {
    id: 'i',
    assignmentId: 'a',
    severity: Severity.Minor,
    description: 'd',
    status: 'reported',
    reportedAt: new Date(),
    createdAt: new Date(),
  };

  it.each([
    // TODO(HU_FLEETOPS_INC_01): reemplazar por pruebas reales de esta HU (persistir el incidente).
    [
      'PrismaIncidentRepository.save',
      () => new PrismaIncidentRepository().save(incident),
    ],
    // TODO(HU_FLEETOPS_INC_05): reemplazar por pruebas reales de esta HU (consultar por id).
    [
      'PrismaIncidentRepository.findById',
      () => new PrismaIncidentRepository().findById('i'),
    ],
    // TODO(HU_FLEETOPS_INC_06): reemplazar por pruebas reales de esta HU (listar con filtros).
    [
      'PrismaIncidentRepository.findAll',
      () => new PrismaIncidentRepository().findAll({}, 0, 20),
    ],
    // TODO(HU_FLEETOPS_INC_02): reemplazar por pruebas reales de esta HU (consulta de la asignación).
    [
      'AssignmentsHttpClient.findById',
      () => new AssignmentsHttpClient().findById('a'),
    ],
    // TODO(HU_FLEETOPS_INC_03): reemplazar por pruebas reales de esta HU (consulta del vehículo).
    [
      'VehiclesHttpClient.findById',
      () => new VehiclesHttpClient().findById('v'),
    ],
    // TODO(HU_FLEETOPS_INC_04): reemplazar por pruebas reales de esta HU (publicación en SNS).
    [
      'SnsEventPublisher.publish',
      () =>
        new SnsEventPublisher().publish({
          event_id: 'e',
          event_type: 'minor_incident_reported_event',
          occurred_at: 'now',
          source: 'incident',
          correlation_id: 'c',
          data: {},
        }),
    ],
    // TODO(HU_FLEETOPS_INC_04): reemplazar por pruebas reales de esta HU (publicador del outbox).
    [
      'OutboxPublisher.publishPending',
      () => new OutboxPublisher().publishPending(),
    ],
  ])('%s responde 501', async (_name, call) => {
    await expect(call()).rejects.toBeInstanceOf(NotImplementedException);
  });
});
