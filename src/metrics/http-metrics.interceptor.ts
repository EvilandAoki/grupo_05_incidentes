import {
  CallHandler,
  ExecutionContext,
  Injectable,
  NestInterceptor,
} from '@nestjs/common';
import { Histogram } from '@prometheus-io/client';
import { InjectMetric } from '@willsoto/nestjs-prometheus';
import type { Request, Response } from 'express';
import { Observable } from 'rxjs';

export const HTTP_DURATION_METRIC = 'http_request_duration_seconds';
export const HTTP_DURATION_BUCKETS = [0.05, 0.1, 0.2, 0.5, 1, 2, 5];

const EXCLUDED_ROUTES = ['/metrics', '/health'];

// Mide la latencia de cada petición (meta del DAS: p95 de POST < 500 ms y de GET por id < 200 ms).
@Injectable()
export class HttpMetricsInterceptor implements NestInterceptor {
  constructor(
    @InjectMetric(HTTP_DURATION_METRIC)
    private readonly duration: Histogram<'method' | 'route' | 'status_code'>,
  ) {}

  intercept(context: ExecutionContext, next: CallHandler): Observable<unknown> {
    const http = context.switchToHttp();
    const request = http.getRequest<Request>();
    const response = http.getResponse<Response>();
    // Ruta del controlador (p. ej. /incidents/:id), no la URL con el id real.
    const route: string = request.route?.path ?? request.path;

    if (!EXCLUDED_ROUTES.includes(route)) {
      const stop = this.duration.startTimer();
      // 'finish' ya trae el status final, también cuando el filtro global convirtió un error.
      response.once('finish', () =>
        stop({
          method: request.method,
          route,
          status_code: response.statusCode,
        }),
      );
    }
    return next.handle();
  }
}
