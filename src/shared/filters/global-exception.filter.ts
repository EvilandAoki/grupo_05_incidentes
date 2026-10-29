import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import type { Request, Response } from 'express';
import { ErrorCode, errorCodeForStatus } from '../errors/error-catalog';

interface ErrorBody {
  code: string;
  message: string;
  timestamp: string;
  path: string;
  errors?: string[];
}

interface ExceptionPayload {
  code?: unknown;
  message?: unknown;
}

const BOGOTA_OFFSET_MS = 5 * 60 * 60 * 1000;

function nowBogotaIso(): string {
  return new Date(Date.now() - BOGOTA_OFFSET_MS)
    .toISOString()
    .replace('Z', '-05:00');
}

@Catch()
export class GlobalExceptionFilter implements ExceptionFilter {
  private readonly logger = new Logger(GlobalExceptionFilter.name);

  catch(exception: unknown, host: ArgumentsHost): void {
    const http = host.switchToHttp();
    const request = http.getRequest<Request>();
    const response = http.getResponse<Response>();

    const status =
      exception instanceof HttpException
        ? exception.getStatus()
        : HttpStatus.INTERNAL_SERVER_ERROR;

    if (status >= HttpStatus.INTERNAL_SERVER_ERROR && status !== 501) {
      this.logger.error(
        exception instanceof Error ? exception.stack : String(exception),
      );
    }

    response.status(status).json(this.buildBody(exception, status, request));
  }

  private buildBody(
    exception: unknown,
    status: number,
    request: Request,
  ): ErrorBody {
    const body: ErrorBody = {
      code: errorCodeForStatus(status),
      message: 'Internal server error',
      timestamp: nowBogotaIso(),
      path: request.url,
    };

    if (!(exception instanceof HttpException)) {
      return body;
    }

    // Excepciones sin `message` en su cuerpo (p. ej. Terminus) conservan el mensaje de la excepción.
    body.message = exception.message;

    const payload = exception.getResponse();
    if (typeof payload === 'string') {
      return body;
    }

    const { code, message } = payload as ExceptionPayload;
    if (typeof code === 'string') {
      body.code = code;
    }
    if (Array.isArray(message)) {
      // ValidationPipe entrega un arreglo con un mensaje por restricción incumplida.
      body.message = 'Validation failed';
      body.code = ErrorCode.ValidationError;
      body.errors = message.map(String);
    } else if (typeof message === 'string') {
      body.message = message;
    }
    return body;
  }
}
