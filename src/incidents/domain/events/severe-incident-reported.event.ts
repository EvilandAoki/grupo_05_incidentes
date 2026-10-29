import { IncidentEvent, IncidentReportedData } from './incident-event';

export const SEVERE_INCIDENT_REPORTED_EVENT = 'severe_incident_reported_event';

export type SevereIncidentReportedEvent = IncidentEvent<
  typeof SEVERE_INCIDENT_REPORTED_EVENT,
  IncidentReportedData
>;
