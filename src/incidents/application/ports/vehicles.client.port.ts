export const VEHICLES_CLIENT = Symbol('VEHICLES_CLIENT');

// TODO(HU_FLEETOPS_INC_01): confirmar ruta `GET /vehicles/{id}` y campos con el equipo de Vehículos.
export interface VehicleSummary {
  id: string;
  status: string;
}

export interface VehiclesClient {
  findById(id: string): Promise<VehicleSummary | null>;
}
