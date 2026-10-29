import { Severity } from '../../domain/severity';

export interface CreateIncidentContext {
  assignmentId: string;
  severity: Severity;
  description: string;
  reportedAt: Date;
}
