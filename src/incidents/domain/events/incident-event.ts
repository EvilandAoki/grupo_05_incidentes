// Sobre común de los eventos de dominio publicados por el servicio (contrato en snake_case).
export interface IncidentEvent<TType extends string, TData> {
  event_id: string;
  event_type: TType;
  occurred_at: string;
  source: 'incident';
  correlation_id: string;
  data: TData;
}

// TODO(HU_FLEETOPS_INC_01): confirmar los campos de `data` contra el catálogo FleetOps_Endpoints_y_Eventos.
export interface IncidentReportedData {
  incident_id: string;
  assignment_id: string;
  severity: string;
  description: string;
  reported_at: string;
}
