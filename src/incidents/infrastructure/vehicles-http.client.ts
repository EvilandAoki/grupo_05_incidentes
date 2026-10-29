import { Injectable, NotImplementedException } from '@nestjs/common';
import {
  VehicleSummary,
  VehiclesGateway,
} from '../application/ports/vehicles.gateway.port';

// TODO(HU_FLEETOPS_INC_03): consulta HTTP a VEHICLES_BASE_URL (usa HttpService de @nestjs/axios).
// TODO(HU_FLEETOPS_INC_07): circuit breaker (opossum) y manejo de timeout -> dependency_unavailable.
@Injectable()
export class VehiclesHttpClient implements VehiclesGateway {
  findById(_id: string): Promise<VehicleSummary | null> {
    return Promise.reject(
      new NotImplementedException('VehiclesHttpClient.findById'),
    );
  }
}
