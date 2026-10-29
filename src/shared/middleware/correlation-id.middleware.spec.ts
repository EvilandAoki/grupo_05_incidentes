import type { Response } from 'express';
import {
  CorrelationIdMiddleware,
  RequestWithCorrelation,
} from './correlation-id.middleware';

describe('CorrelationIdMiddleware', () => {
  const middleware = new CorrelationIdMiddleware();
  let res: { setHeader: jest.Mock };
  let next: jest.Mock;

  beforeEach(() => {
    res = { setHeader: jest.fn() };
    next = jest.fn();
  });

  function run(headers: Record<string, string | string[]>) {
    const req = { headers } as unknown as RequestWithCorrelation;
    middleware.use(req, res as unknown as Response, next);
    return req;
  }

  it('propaga la cabecera recibida', () => {
    const req = run({ 'x-correlation-id': 'abc-123' });

    expect(req.correlationId).toBe('abc-123');
    expect(res.setHeader).toHaveBeenCalledWith('X-Correlation-Id', 'abc-123');
    expect(next).toHaveBeenCalledTimes(1);
  });

  it('genera un UUID cuando no llega la cabecera', () => {
    const req = run({});

    expect(req.correlationId).toMatch(/^[0-9a-f-]{36}$/);
    expect(res.setHeader).toHaveBeenCalledWith(
      'X-Correlation-Id',
      req.correlationId,
    );
    expect(next).toHaveBeenCalledTimes(1);
  });

  it('genera un UUID cuando la cabecera está vacía o repetida', () => {
    expect(run({ 'x-correlation-id': '  ' }).correlationId).toMatch(
      /^[0-9a-f-]{36}$/,
    );
    expect(run({ 'x-correlation-id': ['a', 'b'] }).correlationId).toMatch(
      /^[0-9a-f-]{36}$/,
    );
  });
});
