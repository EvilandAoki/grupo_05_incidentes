import { Incident } from '../../domain/incident';
import { Severity } from '../../domain/severity';

export const INCIDENT_REPOSITORY = Symbol('INCIDENT_REPOSITORY');

export interface IncidentFilter {
  assignmentId?: string;
  severity?: Severity;
  reportedFrom?: Date;
  reportedTo?: Date;
}

export interface IncidentPage {
  content: Incident[];
  total: number;
}

export interface IncidentRepository {
  save(incident: Incident): Promise<Incident>;
  findById(id: string): Promise<Incident | null>;
  findAll(
    filter: IncidentFilter,
    page: number,
    size: number,
  ): Promise<IncidentPage>;
}
