import { Injectable, NestMiddleware } from '@nestjs/common';
import type { NextFunction, Request, Response } from 'express';
import { ClsService } from 'nestjs-cls';
import { CORRELATION_ID_KEY } from '../context/correlation-context';

// El id lo genera ClsModule (idGenerator = resolveCorrelationId); aquí se guarda en el
// contexto de la petición y se devuelve en la cabecera de respuesta.
@Injectable()
export class CorrelationIdMiddleware implements NestMiddleware {
  constructor(private readonly cls: ClsService) {}

  use(_req: Request, res: Response, next: NextFunction): void {
    const correlationId = this.cls.getId();
    this.cls.set(CORRELATION_ID_KEY, correlationId);
    res.setHeader('X-Correlation-Id', correlationId);
    next();
  }
}
