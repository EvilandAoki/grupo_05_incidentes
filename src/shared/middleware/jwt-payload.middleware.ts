import { Injectable, NestMiddleware } from '@nestjs/common';
import type { NextFunction, Request, Response } from 'express';

export interface JwtPayload {
  sub?: string;
  groups: string[];
  driverId?: string;
}

export interface RequestWithJwt extends Request {
  jwt?: JwtPayload;
}

// El API Gateway ya validó la firma del token: aquí solo se lee el payload, sin verificarlo.
@Injectable()
export class JwtPayloadMiddleware implements NestMiddleware {
  use(req: RequestWithJwt, _res: Response, next: NextFunction): void {
    const payload = this.decode(req.headers.authorization);
    if (payload) {
      req.jwt = payload;
    }
    next();
  }

  private decode(authorization?: string): JwtPayload | undefined {
    const [scheme, token] = authorization?.split(' ') ?? [];
    if (scheme?.toLowerCase() !== 'bearer' || !token) {
      return undefined;
    }

    try {
      const segment = token.split('.')[1] ?? '';
      const claims = JSON.parse(
        Buffer.from(segment, 'base64url').toString('utf8'),
      ) as Record<string, unknown>;
      const groups = claims['cognito:groups'];
      return {
        sub: typeof claims.sub === 'string' ? claims.sub : undefined,
        groups: Array.isArray(groups) ? groups.map(String) : [],
        driverId:
          typeof claims['custom:driver_id'] === 'string'
            ? claims['custom:driver_id']
            : undefined,
      };
    } catch {
      return undefined;
    }
  }
}
