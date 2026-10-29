import { CreateIncidentContext } from './create-incident.context';
import { ValidationHandler } from './validation-handler';

export class AssignmentInProgressValidator extends ValidationHandler<CreateIncidentContext> {
  protected validate(_context: CreateIncidentContext): Promise<void> {
    // TODO(HU_FLEETOPS_INC_02): consultar AssignmentsGateway y lanzar 409 assignment_not_in_progress.
    return Promise.resolve();
  }
}
