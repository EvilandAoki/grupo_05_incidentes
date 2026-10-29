import { Injectable, NotImplementedException } from '@nestjs/common';
import { Incident } from '../domain/incident';
import { Severity } from '../domain/severity';
import { IncidentFilter, IncidentPage } from './ports/incident.repository.port';

export interface CreateIncidentCommand {
  assignmentId: string;
  severity: Severity;
  description: string;
  reportedAt: Date;
}

export interface ListIncidentsQuery extends IncidentFilter {
  page: number;
  size: number;
}

@Injectable()
export class IncidentService {
  create(_command: CreateIncidentCommand): Promise<Incident> {
    return Promise.reject(
      new NotImplementedException('POST /incidents: TODO(HU_FLEETOPS_INC_01)'),
    );
  }

  findById(_id: string): Promise<Incident> {
    return Promise.reject(
      new NotImplementedException(
        'GET /incidents/{id}: TODO(HU_FLEETOPS_INC_02)',
      ),
    );
  }

  list(_query: ListIncidentsQuery): Promise<IncidentPage> {
    return Promise.reject(
      new NotImplementedException('GET /incidents: TODO(HU_FLEETOPS_INC_03)'),
    );
  }
}
