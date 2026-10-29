import { randomUUID } from 'node:crypto';
import { Injectable, NestMiddleware } from '@nestjs/common';
import type { NextFunction, Request, Response } from 'express';

export const CORRELATION_ID_HEADER = 'x-correlation-id';

export interface RequestWithCorrelation extends Request {
  correlationId?: string;
}

@Injectable()
export class CorrelationIdMiddleware implements NestMiddleware {
  use(req: RequestWithCorrelation, res: Response, next: NextFunction): void {
    const incoming = req.headers[CORRELATION_ID_HEADER];
    const correlationId =
      typeof incoming === 'string' && incoming.trim() !== ''
        ? incoming
        : randomUUID();

    req.correlationId = correlationId;
    res.setHeader('X-Correlation-Id', correlationId);
    next();
  }
}
