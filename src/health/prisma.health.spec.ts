import { HealthIndicatorService } from '@nestjs/terminus';
import { PrismaService } from '../shared/prisma/prisma.service';
import { PrismaHealthIndicator } from './prisma.health';

describe('PrismaHealthIndicator', () => {
  const queryRaw = jest.fn();
  const indicator = new PrismaHealthIndicator(
    { $queryRaw: queryRaw } as unknown as PrismaService,
    new HealthIndicatorService(),
  );

  beforeEach(() => queryRaw.mockReset());

  it('reporta up cuando SELECT 1 responde', async () => {
    queryRaw.mockResolvedValue([{ '?column?': 1 }]);

    await expect(indicator.isHealthy('database')).resolves.toEqual({
      database: { status: 'up' },
    });
  });

  it('reporta down cuando la BD falla', async () => {
    queryRaw.mockRejectedValue(new Error('ECONNREFUSED'));

    await expect(indicator.isHealthy('database')).resolves.toEqual({
      database: { status: 'down', message: 'La BD no responde' },
    });
  });
});
