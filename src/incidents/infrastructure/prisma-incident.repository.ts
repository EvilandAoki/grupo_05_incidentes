import { Injectable, NotImplementedException } from '@nestjs/common';
import { Incident } from '../domain/incident';
import {
  IncidentFilter,
  IncidentPage,
  IncidentRepository,
} from '../application/ports/incident.repository.port';

// TODO(HU_FLEETOPS_INC_01): inyectar PrismaService (src/shared/prisma) al implementar el primer método.
@Injectable()
export class PrismaIncidentRepository implements IncidentRepository {
  // TODO(HU_FLEETOPS_INC_01): insertar el incidente y su fila de outbox_events en una transacción.
  save(_incident: Incident): Promise<Incident> {
    return Promise.reject(
      new NotImplementedException('PrismaIncidentRepository.save'),
    );
  }

  // TODO(HU_FLEETOPS_INC_05): consulta por id.
  findById(_id: string): Promise<Incident | null> {
    return Promise.reject(
      new NotImplementedException('PrismaIncidentRepository.findById'),
    );
  }

  // TODO(HU_FLEETOPS_INC_06): listado filtrado y paginado, con el conteo por severidad (summary).
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
