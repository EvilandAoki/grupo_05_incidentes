import { Injectable, NotImplementedException } from '@nestjs/common';
import { Incident } from '../domain/incident';
import {
  IncidentFilter,
  IncidentPage,
  IncidentRepository,
} from '../application/ports/incident.repository.port';

// TODO(HU_FLEETOPS_INC_01): inyectar PrismaService (src/shared/prisma) e implementar la persistencia.
@Injectable()
export class PrismaIncidentRepository implements IncidentRepository {
  save(_incident: Incident): Promise<Incident> {
    return Promise.reject(
      new NotImplementedException('PrismaIncidentRepository.save'),
    );
  }

  findById(_id: string): Promise<Incident | null> {
    return Promise.reject(
      new NotImplementedException('PrismaIncidentRepository.findById'),
    );
  }

  findAll(
    _filter: IncidentFilter,
    _page: number,
    _size: number,
  ): Promise<IncidentPage> {
    return Promise.reject(
      new NotImplementedException('PrismaIncidentRepository.findAll'),
    );
  }
}
