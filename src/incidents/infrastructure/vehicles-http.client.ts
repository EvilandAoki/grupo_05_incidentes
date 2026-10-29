import { Injectable, NotImplementedException } from '@nestjs/common';
import {
  VehicleSummary,
  VehiclesClient,
} from '../application/ports/vehicles.client.port';

// TODO(HU_FLEETOPS_INC_01): llamada HTTP a VEHICLES_BASE_URL con timeout y circuit breaker (opossum).
@Injectable()
export class VehiclesHttpClient implements VehiclesClient {
  findById(_id: string): Promise<VehicleSummary | null> {
    return Promise.reject(
      new NotImplementedException('VehiclesHttpClient.findById'),
    );
  }
}
