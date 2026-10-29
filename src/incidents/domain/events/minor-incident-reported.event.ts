import { IncidentEvent, IncidentReportedData } from './incident-event';

export const MINOR_INCIDENT_REPORTED_EVENT = 'minor_incident_reported_event';

export type MinorIncidentReportedEvent = IncidentEvent<
  typeof MINOR_INCIDENT_REPORTED_EVENT,
  IncidentReportedData
>;
