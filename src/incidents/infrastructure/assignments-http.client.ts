import { Injectable, NotImplementedException } from '@nestjs/common';
import {
  AssignmentsGateway,
  AssignmentSummary,
} from '../application/ports/assignments.gateway.port';

// TODO(HU_FLEETOPS_INC_02): consulta HTTP a ASSIGNMENTS_BASE_URL (usa HttpService de @nestjs/axios).
// TODO(HU_FLEETOPS_INC_07): circuit breaker (opossum) y manejo de timeout -> dependency_unavailable.
@Injectable()
export class AssignmentsHttpClient implements AssignmentsGateway {
  findById(_id: string): Promise<AssignmentSummary | null> {
    return Promise.reject(
      new NotImplementedException('AssignmentsHttpClient.findById'),
    );
  }
}
