import { Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from './prisma.service';

describe('PrismaService', () => {
  let service: PrismaService;
  let connect: jest.SpyInstance;
  let disconnect: jest.SpyInstance;

  beforeEach(() => {
    const config = {
      getOrThrow: jest
        .fn()
        .mockReturnValue('postgresql://u:p@localhost:5432/db'),
    } as unknown as ConfigService;
    service = new PrismaService(config);
    connect = jest.spyOn(service, '$connect').mockResolvedValue();
    disconnect = jest.spyOn(service, '$disconnect').mockResolvedValue();
    jest.spyOn(Logger.prototype, 'error').mockImplementation(() => undefined);
  });

  afterEach(() => jest.restoreAllMocks());

  it('se conecta al iniciar el módulo', async () => {
    await service.onModuleInit();

    expect(connect).toHaveBeenCalledTimes(1);
  });

  it('no tumba la app si la BD no responde al iniciar', async () => {
    connect.mockRejectedValue(new Error('ECONNREFUSED'));

    await expect(service.onModuleInit()).resolves.toBeUndefined();
    expect(Logger.prototype.error).toHaveBeenCalledWith(
      expect.stringContaining('ECONNREFUSED'),
    );
  });

  it('se desconecta al destruir el módulo', async () => {
    await service.onModuleDestroy();

    expect(disconnect).toHaveBeenCalledTimes(1);
  });
});
