import { Severity } from './severity';

export type IncidentStatus = 'reported';

const BOGOTA_OFFSET_MS = 5 * 60 * 60 * 1000;

// Contrato FleetOps: fechas ISO 8601 con offset -05:00.
export function toBogotaIso(date: Date): string {
  return new Date(date.getTime() - BOGOTA_OFFSET_MS)
    .toISOString()
    .replace('Z', '-05:00');
}

export interface Incident {
  id: string;
  assignmentId: string;
  severity: Severity;
  description: string;
  status: IncidentStatus;
  reportedAt: Date;
  createdAt: Date;
}
