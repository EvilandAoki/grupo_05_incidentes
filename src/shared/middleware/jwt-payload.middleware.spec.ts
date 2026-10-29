import type { Response } from 'express';
import { JwtPayloadMiddleware, RequestWithJwt } from './jwt-payload.middleware';

function token(claims: Record<string, unknown>): string {
  const encode = (value: unknown) =>
    Buffer.from(JSON.stringify(value)).toString('base64url');
  return `${encode({ alg: 'RS256' })}.${encode(claims)}.firma`;
}

describe('JwtPayloadMiddleware', () => {
  const middleware = new JwtPayloadMiddleware();
  let next: jest.Mock;

  beforeEach(() => {
    next = jest.fn();
  });

  function run(authorization?: string) {
    const req = { headers: { authorization } } as unknown as RequestWithJwt;
    middleware.use(req, {} as Response, next);
    return req;
  }

  it('decodifica sub, cognito:groups y custom:driver_id', () => {
    const req = run(
      `Bearer ${token({
        sub: 'user-1',
        'cognito:groups': ['drivers', 'ops'],
        'custom:driver_id': 'drv-9',
      })}`,
    );

    expect(req.jwt).toEqual({
      sub: 'user-1',
      groups: ['drivers', 'ops'],
      driverId: 'drv-9',
    });
    expect(next).toHaveBeenCalledTimes(1);
  });

  it('tolera claims ausentes', () => {
    expect(run(`Bearer ${token({})}`).jwt).toEqual({
      sub: undefined,
      groups: [],
      driverId: undefined,
    });
  });

  it('tolera token ausente', () => {
    expect(run().jwt).toBeUndefined();
    expect(next).toHaveBeenCalledTimes(1);
  });

  it('ignora esquemas distintos de Bearer', () => {
    expect(run(`Basic ${token({ sub: 'x' })}`).jwt).toBeUndefined();
  });

  it('tolera token mal formado', () => {
    expect(run('Bearer no-es-un-jwt').jwt).toBeUndefined();
    expect(run('Bearer a.%%%.c').jwt).toBeUndefined();
    expect(next).toHaveBeenCalledTimes(2);
  });
});
