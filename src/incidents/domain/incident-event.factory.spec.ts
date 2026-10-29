import { Incident } from './incident';
import { IncidentEventFactory } from './incident-event.factory';
import { Severity } from './severity';

describe('IncidentEventFactory', () => {
  const factory = new IncidentEventFactory();
  const now = new Date('2026-10-28T15:00:00.000Z');
  const incident: Incident = {
    id: '11111111-1111-4111-8111-111111111111',
    assignmentId: '22222222-2222-4222-8222-222222222222',
    severity: Severity.Minor,
    description: 'Llanta pinchada',
    status: 'reported',
    reportedAt: new Date('2026-10-28T14:30:00.000Z'),
    createdAt: new Date('2026-10-28T14:30:05.000Z'),
  };

  const refs = {
    vehicleId: '33333333-3333-4333-8333-333333333333',
    driverId: '44444444-4444-4444-8444-444444444444',
  };

  it('severidad minor produce minor_incident_reported_event', () => {
    const event = factory.create(incident, refs, 'corr-1', now, 'evt-1');

    expect(event.event_type).toBe('minor_incident_reported_event');
  });

  it('severidad severe produce severe_incident_reported_event', () => {
    const event = factory.create(
      { ...incident, severity: Severity.Severe },
      refs,
      'corr-1',
      now,
      'evt-1',
    );

    expect(event.event_type).toBe('severe_incident_reported_event');
  });

  it('arma el sobre completo con fechas -05:00', () => {
    expect(factory.create(incident, refs, 'corr-1', now, 'evt-1')).toEqual({
      event_id: 'evt-1',
      event_type: 'minor_incident_reported_event',
      occurred_at: '2026-10-28T10:00:00.000-05:00',
      source: 'incident',
      correlation_id: 'corr-1',
      data: {
        incident_id: incident.id,
        assignment_id: incident.assignmentId,
        vehicle_id: refs.vehicleId,
        driver_id: refs.driverId,
        severity: 'minor',
        description: 'Llanta pinchada',
        reported_at: '2026-10-28T09:30:00.000-05:00',
      },
    });
  });

  it('genera event_id y fecha por defecto', () => {
    const event = factory.create(incident, refs, 'corr-1');

    expect(event.event_id).toMatch(/^[0-9a-f-]{36}$/);
    expect(event.occurred_at).toMatch(/-05:00$/);
  });
});
