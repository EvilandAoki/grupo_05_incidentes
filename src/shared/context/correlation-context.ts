import { randomUUID } from 'node:crypto';
import type { Request } from 'express';
import { ClsServiceManager } from 'nestjs-cls';

export const CORRELATION_ID_KEY = 'correlationId';
export const CORRELATION_ID_HEADER = 'x-correlation-id';

/** Usa la cabecera X-Correlation-Id de la petición o genera un UUID si falta o está vacía. */
export function resolveCorrelationId(req: Pick<Request, 'headers'>): string {
  const incoming = req.headers[CORRELATION_ID_HEADER];
  return typeof incoming === 'string' && incoming.trim() !== ''
    ? incoming
    : randomUUID();
}

/** Correlation id de la petición en curso, disponible en cualquier capa sin pasarlo por parámetro. */
export function getCorrelationId(): string | undefined {
  return ClsServiceManager.getClsService().get<string>(CORRELATION_ID_KEY);
}
