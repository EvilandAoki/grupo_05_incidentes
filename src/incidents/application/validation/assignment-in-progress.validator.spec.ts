import { Severity } from '../../domain/severity';
import { AssignmentInProgressValidator } from './assignment-in-progress.validator';

describe('AssignmentInProgressValidator (arquetipo)', () => {
  it('deja pasar la solicitud hasta implementar la HU', async () => {
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
