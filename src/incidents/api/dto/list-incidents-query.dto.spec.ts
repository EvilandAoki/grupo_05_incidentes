import { plainToInstance } from 'class-transformer';
import { validate } from 'class-validator';
import { ListIncidentsQueryDto } from './list-incidents-query.dto';

async function check(query: Record<string, unknown>) {
  const dto = plainToInstance(ListIncidentsQueryDto, query);
  const errors = await validate(dto);
  return { dto, properties: errors.map((e) => e.property) };
}

describe('ListIncidentsQueryDto', () => {
  it('aplica page=0 y size=20 por defecto', async () => {
    const { dto, properties } = await check({});

    expect(properties).toEqual([]);
    expect(dto.page).toBe(0);
    expect(dto.size).toBe(20);
  });

  it('convierte page y size desde texto', async () => {
    const { dto, properties } = await check({ page: '2', size: '50' });

    expect(properties).toEqual([]);
    expect(dto.page).toBe(2);
    expect(dto.size).toBe(50);
  });

  it('acepta todos los filtros', async () => {
    const { properties } = await check({
      assignment_id: '3f2b8c1e-5a7d-4e0b-9c64-1d2e3f4a5b6c',
      severity: 'severe',
      reported_from: '2026-10-01T00:00:00-05:00',
      reported_to: '2026-10-31T23:59:59-05:00',
    });

    expect(properties).toEqual([]);
  });

  it.each([
    ['page negativa', { page: '-1' }, 'page'],
    ['size en 0', { size: '0' }, 'size'],
    ['size mayor a 100', { size: '101' }, 'size'],
    ['severity inválida', { severity: 'x' }, 'severity'],
    ['assignment_id inválido', { assignment_id: 'x' }, 'assignment_id'],
    ['reported_from inválida', { reported_from: 'ayer' }, 'reported_from'],
    ['reported_to inválida', { reported_to: 'mañana' }, 'reported_to'],
  ])('rechaza %s', async (_name, query, property) => {
    const { properties } = await check(query);

    expect(properties).toEqual([property]);
  });
});
