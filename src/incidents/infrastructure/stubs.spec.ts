import { NotImplementedException } from '@nestjs/common';
import { Incident } from '../domain/incident';
import { Severity } from '../domain/severity';
import { AssignmentsHttpClient } from './assignments-http.client';
import { OutboxPublisher } from './outbox.publisher';
import { PrismaIncidentRepository } from './prisma-incident.repository';
import { SnsEventPublisher } from './sns-event.publisher';
import { VehiclesHttpClient } from './vehicles-http.client';

// Mientras las HU no los implementen, todos los componentes de infraestructura responden 501.
describe('infraestructura (arquetipo)', () => {
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
    [
      'PrismaIncidentRepository.save',
      () => new PrismaIncidentRepository().save(incident),
    ],
    [
      'PrismaIncidentRepository.findById',
      () => new PrismaIncidentRepository().findById('i'),
    ],
    [
      'PrismaIncidentRepository.findAll',
      () => new PrismaIncidentRepository().findAll({}, 0, 20),
    ],
    [
      'AssignmentsHttpClient.findById',
      () => new AssignmentsHttpClient().findById('a'),
    ],
    [
      'VehiclesHttpClient.findById',
      () => new VehiclesHttpClient().findById('v'),
    ],
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
    [
      'OutboxPublisher.publishPending',
      () => new OutboxPublisher().publishPending(),
    ],
  ])('%s responde 501', async (_name, call) => {
    await expect(call()).rejects.toBeInstanceOf(NotImplementedException);
  });
});
