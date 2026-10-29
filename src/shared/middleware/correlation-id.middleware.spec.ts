import type { Request, Response } from 'express';
import { ClsService } from 'nestjs-cls';
import { CorrelationIdMiddleware } from './correlation-id.middleware';

describe('CorrelationIdMiddleware', () => {
  it('guarda el id del contexto CLS y lo devuelve en X-Correlation-Id', () => {
    const cls = {
      getId: jest.fn().mockReturnValue('abc-123'),
      set: jest.fn(),
    };
    const res = { setHeader: jest.fn() };
    const next = jest.fn();

    new CorrelationIdMiddleware(cls as unknown as ClsService).use(
      {} as Request,
      res as unknown as Response,
      next,
    );

    expect(cls.set).toHaveBeenCalledWith('correlationId', 'abc-123');
    expect(res.setHeader).toHaveBeenCalledWith('X-Correlation-Id', 'abc-123');
    expect(next).toHaveBeenCalledTimes(1);
  });
});
