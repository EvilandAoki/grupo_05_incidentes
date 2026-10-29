import { Severity } from '../severity';

// Sobre común de los eventos de dominio publicados por el servicio (contrato en snake_case).
export interface IncidentEvent<TType extends string, TData> {
  event_id: string;
  event_type: TType;
  occurred_at: string;
  source: 'incident';
  correlation_id: string;
  data: TData;
}

export interface IncidentReportedData {
  incident_id: string;
  assignment_id: string;
  vehicle_id: string;
  driver_id: string;
  severity: Severity;
  description: string;
  reported_at: string;
}
