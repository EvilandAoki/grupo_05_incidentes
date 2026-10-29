import { plainToInstance } from 'class-transformer';
import { validate } from 'class-validator';
import { CreateIncidentDto } from './create-incident.dto';

const valid = {
  assignment_id: '3f2b8c1e-5a7d-4e0b-9c64-1d2e3f4a5b6c',
  severity: 'minor',
  description: 'Llanta pinchada',
  reported_at: '2026-10-28T09:30:00-05:00',
};

async function errorsFor(payload: Record<string, unknown>) {
  const errors = await validate(plainToInstance(CreateIncidentDto, payload));
  return errors.map((e) => e.property);
}

describe('CreateIncidentDto', () => {
  it('acepta un incidente leve y uno grave', async () => {
    expect(await errorsFor(valid)).toEqual([]);
    expect(await errorsFor({ ...valid, severity: 'severe' })).toEqual([]);
  });

  it('rechaza assignment_id que no es UUID', async () => {
    expect(await errorsFor({ ...valid, assignment_id: '123' })).toEqual([
      'assignment_id',
    ]);
  });

  it('rechaza una severidad desconocida', async () => {
    expect(await errorsFor({ ...valid, severity: 'critical' })).toEqual([
      'severity',
    ]);
  });

  it('rechaza descripción vacía o de más de 2000 caracteres', async () => {
    expect(await errorsFor({ ...valid, description: '' })).toEqual([
      'description',
    ]);
    expect(
      await errorsFor({ ...valid, description: 'x'.repeat(2001) }),
    ).toEqual(['description']);
  });

  it('rechaza reported_at que no es ISO 8601', async () => {
    expect(await errorsFor({ ...valid, reported_at: '28/10/2026' })).toEqual([
      'reported_at',
    ]);
  });
});
