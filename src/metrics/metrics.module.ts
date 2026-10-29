import { Controller, Get, Module, Res } from '@nestjs/common';
import { APP_INTERCEPTOR } from '@nestjs/core';
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import {
  makeHistogramProvider,
  PrometheusController,
  PrometheusModule,
} from '@willsoto/nestjs-prometheus';
import type { Response } from 'express';
import {
  HTTP_DURATION_BUCKETS,
  HTTP_DURATION_METRIC,
  HttpMetricsInterceptor,
} from './http-metrics.interceptor';

// Controlador propio solo para que /metrics aparezca documentado en Swagger.
@ApiTags('metrics')
@Controller()
export class MetricsController extends PrometheusController {
  @Get()
  @ApiOperation({ summary: 'Métricas en formato Prometheus' })
  @ApiResponse({ status: 200, description: 'Texto en formato Prometheus' })
  index(@Res({ passthrough: true }) response: Response) {
    return super.index(response);
  }
}

@Module({
  imports: [
    PrometheusModule.register({
      path: '/metrics',
      defaultMetrics: { enabled: true },
      controller: MetricsController,
    }),
  ],
  providers: [
    makeHistogramProvider({
      name: HTTP_DURATION_METRIC,
      help: 'Duración de las peticiones HTTP en segundos',
      labelNames: ['method', 'route', 'status_code'],
      buckets: HTTP_DURATION_BUCKETS,
    }),
    { provide: APP_INTERCEPTOR, useClass: HttpMetricsInterceptor },
  ],
})
export class MetricsModule {}
