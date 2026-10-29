import { Controller, Get, Module, Res } from '@nestjs/common';
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import {
  PrometheusController,
  PrometheusModule,
} from '@willsoto/nestjs-prometheus';
import type { Response } from 'express';

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
})
export class MetricsModule {}
