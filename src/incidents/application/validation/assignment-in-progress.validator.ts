import { Severity } from '../../domain/severity';
import { ValidationHandler } from './validation-handler';

export interface CreateIncidentContext {
  assignmentId: string;
  severity: Severity;
  description: string;
  reportedAt: Date;
}

export class AssignmentInProgressValidator extends ValidationHandler<CreateIncidentContext> {
  protected validate(_context: CreateIncidentContext): Promise<void> {
    // TODO(HU_FLEETOPS_INC_01): consultar AssignmentsClient y lanzar 409 assignment_not_in_progress.
    return Promise.resolve();
  }
}
