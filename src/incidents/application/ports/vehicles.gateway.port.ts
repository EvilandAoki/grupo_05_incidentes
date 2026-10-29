export const VEHICLES_GATEWAY = Symbol('VEHICLES_GATEWAY');

// TODO(HU_FLEETOPS_INC_03): confirmar con Vehículos la ruta definitiva (`GET /vehicles/{id}`) y los campos.
export interface VehicleSummary {
  id: string;
  status: string;
}

export interface VehiclesGateway {
  findById(id: string): Promise<VehicleSummary | null>;
}
