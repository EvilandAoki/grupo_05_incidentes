import { toBogotaIso } from './incident';

describe('toBogotaIso', () => {
  it('expresa la fecha con offset -05:00', () => {
    expect(toBogotaIso(new Date('2026-10-28T14:30:00.000Z'))).toBe(
      '2026-10-28T09:30:00.000-05:00',
    );
  });

  it('cruza el día hacia atrás cuando UTC es de madrugada', () => {
    expect(toBogotaIso(new Date('2026-10-28T02:00:00.000Z'))).toBe(
      '2026-10-27T21:00:00.000-05:00',
    );
  });
});
