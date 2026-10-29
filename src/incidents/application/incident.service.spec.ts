import { NotImplementedException } from '@nestjs/common';
import { Severity } from '../domain/severity';
import { IncidentService } from './incident.service';

describe('IncidentService (arquetipo)', () => {
  const service = new IncidentService();

  it('create responde 501', async () => {
    await expect(
      service.create({
        assignmentId: 'a',
        severity: Severity.Minor,
        description: 'd',
        reportedAt: new Date(),
      }),
    ).rejects.toBeInstanceOf(NotImplementedException);
  });

  it('findById responde 501', async () => {
    await expect(service.findById('id')).rejects.toBeInstanceOf(
      NotImplementedException,
    );
  });

  it('list responde 501', async () => {
    await expect(service.list({ page: 0, size: 20 })).rejects.toBeInstanceOf(
      NotImplementedException,
    );
  });
});
