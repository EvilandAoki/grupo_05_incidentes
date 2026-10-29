import { ServiceUnavailableException } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { HealthCheckService } from '@nestjs/terminus';
import { HealthController } from './health.controller';
import { PrismaHealthIndicator } from './prisma.health';

describe('HealthController', () => {
  let controller: HealthController;
  let healthCheck: jest.Mock;
  let isHealthy: jest.Mock;

  beforeEach(async () => {
    healthCheck = jest.fn();
    isHealthy = jest.fn().mockResolvedValue({ database: { status: 'up' } });
    const moduleRef = await Test.createTestingModule({
      controllers: [HealthController],
      providers: [
        { provide: HealthCheckService, useValue: { check: healthCheck } },
        { provide: PrismaHealthIndicator, useValue: { isHealthy } },
      ],
    }).compile();
    controller = moduleRef.get(HealthController);
  });

  it('responde ok cuando el indicador de BD está up', async () => {
    healthCheck.mockImplementation(
      async (indicators: Array<() => Promise<unknown>>) => ({
        status: 'ok',
        details: Object.assign(
          {},
          ...(await Promise.all(indicators.map((i) => i()))),
        ),
      }),
    );

    await expect(controller.check()).resolves.toEqual({
      status: 'ok',
      details: { database: { status: 'up' } },
    });
    expect(isHealthy).toHaveBeenCalledWith('database');
  });

  it('propaga el 503 cuando Terminus lo lanza', async () => {
    healthCheck.mockRejectedValue(new ServiceUnavailableException());

    await expect(controller.check()).rejects.toBeInstanceOf(
      ServiceUnavailableException,
    );
  });
});
