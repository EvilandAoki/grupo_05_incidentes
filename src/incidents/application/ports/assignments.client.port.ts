export const ASSIGNMENTS_CLIENT = Symbol('ASSIGNMENTS_CLIENT');

// TODO(HU_FLEETOPS_INC_01): confirmar campos y nombres de estado con el equipo de Asignaciones.
export interface AssignmentSummary {
  id: string;
  status: string;
  vehicleId: string;
}

export interface AssignmentsClient {
  findById(id: string): Promise<AssignmentSummary | null>;
}
