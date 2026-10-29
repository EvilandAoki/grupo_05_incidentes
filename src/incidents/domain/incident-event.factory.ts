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

export class IncidentEventFactory {
  create(
    incident: Incident,
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
        severity: incident.severity,
        description: incident.description,
        reported_at: toBogotaIso(incident.reportedAt),
      },
    };
  }
}
