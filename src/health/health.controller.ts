import { Controller, Get } from '@nestjs/common';
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { HealthCheck, HealthCheckService } from '@nestjs/terminus';
import { PrismaHealthIndicator } from './prisma.health';

@ApiTags('health')
@Controller('health')
export class HealthController {
  constructor(
    private readonly health: HealthCheckService,
    private readonly prismaHealth: PrismaHealthIndicator,
  ) {}

  @Get()
  @HealthCheck()
  @ApiOperation({ summary: 'Estado del servicio y de la base de datos' })
  @ApiResponse({ status: 200, description: 'Servicio y BD operativos' })
  @ApiResponse({ status: 503, description: 'dependency_unavailable' })
  check() {
    return this.health.check([() => this.prismaHealth.isHealthy('database')]);
  }
}
