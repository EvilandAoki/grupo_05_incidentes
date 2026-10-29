import { randomUUID } from 'node:crypto';
import { Incident, toBogotaIso } from './incident';
import { Severity } from './severity';
import {
  MINOR_INCIDENT_REPORTED_EVENT,
  MinorIncidentReportedEvent,
} from './events/minor-incident-reported.event';
import {
  SEVERE_INCIDENT_REPORTED_EVENT,
  SevereIncidentReportedEvent,
} from './events/severe-incident-reported.event';

// El incidente no guarda vehicle_id ni driver_id (ADR-10): salen de la asignación consultada.
export interface AssignmentRefs {
  vehicleId: string;
  driverId: string;
}

export class IncidentEventFactory {
  create(
    incident: Incident,
    refs: AssignmentRefs,
    correlationId: string,
    now: Date = new Date(),
    eventId: string = randomUUID(),
  ): MinorIncidentReportedEvent | SevereIncidentReportedEvent {
    const eventType =
      incident.severity === Severity.Severe
        ? SEVERE_INCIDENT_REPORTED_EVENT
        : MINOR_INCIDENT_REPORTED_EVENT;

    return {
      event_id: eventId,
      event_type: eventType,
      occurred_at: toBogotaIso(now),
      source: 'incident',
      correlation_id: correlationId,
      data: {
        incident_id: incident.id,
        assignment_id: incident.assignmentId,
        vehicle_id: refs.vehicleId,
        driver_id: refs.driverId,
        severity: incident.severity,
        description: incident.description,
        reported_at: toBogotaIso(incident.reportedAt),
      },
    };
  }
}
