export const ASSIGNMENTS_GATEWAY = Symbol('ASSIGNMENTS_GATEWAY');

// TODO(HU_FLEETOPS_INC_02): confirmar con Asignaciones los nombres de estado en inglés (`in_progress`, etc.).
export interface AssignmentSummary {
  id: string;
  status: string;
  vehicleId: string;
  driverId: string;
}

export interface AssignmentsGateway {
  findById(id: string): Promise<AssignmentSummary | null>;
}
