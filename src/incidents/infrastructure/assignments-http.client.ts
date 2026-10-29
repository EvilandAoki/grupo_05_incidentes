import { Injectable, NotImplementedException } from '@nestjs/common';
import {
  AssignmentsClient,
  AssignmentSummary,
} from '../application/ports/assignments.client.port';

// TODO(HU_FLEETOPS_INC_01): llamada HTTP a ASSIGNMENTS_BASE_URL con timeout y circuit breaker (opossum).
@Injectable()
export class AssignmentsHttpClient implements AssignmentsClient {
  findById(_id: string): Promise<AssignmentSummary | null> {
    return Promise.reject(
      new NotImplementedException('AssignmentsHttpClient.findById'),
    );
  }
}
