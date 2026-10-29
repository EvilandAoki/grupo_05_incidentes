import { Severity } from '../../domain/severity';
import { VehicleExistsValidator } from './vehicle-exists.validator';

describe('placeholder 501 — borrar al implementar la HU', () => {
  // TODO(HU_FLEETOPS_INC_03): reemplazar por pruebas reales de esta HU (vehículo existente / 404).
  it('VehicleExistsValidator deja pasar la solicitud hasta implementar la HU', async () => {
    await expect(
      new VehicleExistsValidator().handle({
        assignmentId: 'a',
        severity: Severity.Minor,
        description: 'd',
        reportedAt: new Date(),
      }),
    ).resolves.toBeUndefined();
  });
});
