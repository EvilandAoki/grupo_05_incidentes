import { Severity } from '../../domain/severity';
import { AssignmentInProgressValidator } from './assignment-in-progress.validator';

describe('placeholder 501 — borrar al implementar la HU', () => {
  // TODO(HU_FLEETOPS_INC_02): reemplazar por pruebas reales de esta HU (asignación en curso / 409).
  it('AssignmentInProgressValidator deja pasar la solicitud hasta implementar la HU', async () => {
    await expect(
      new AssignmentInProgressValidator().handle({
        assignmentId: 'a',
        severity: Severity.Minor,
        description: 'd',
        reportedAt: new Date(),
      }),
    ).resolves.toBeUndefined();
  });
});
