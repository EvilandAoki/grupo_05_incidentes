import {
  MiddlewareConsumer,
  Module,
  NestModule,
  ValidationPipe,
} from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { APP_FILTER, APP_PIPE } from '@nestjs/core';
import { HealthModule } from './health/health.module';
import { IncidentsModule } from './incidents/incidents.module';
import { MetricsModule } from './metrics/metrics.module';
import { envValidationSchema } from './shared/config/env.validation';
import { GlobalExceptionFilter } from './shared/filters/global-exception.filter';
import { CorrelationIdMiddleware } from './shared/middleware/correlation-id.middleware';
import { JwtPayloadMiddleware } from './shared/middleware/jwt-payload.middleware';
import { PrismaModule } from './shared/prisma/prisma.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      validationSchema: envValidationSchema,
    }),
    PrismaModule,
    IncidentsModule,
    HealthModule,
    MetricsModule,
  ],
  providers: [
    { provide: APP_FILTER, useClass: GlobalExceptionFilter },
    {
      provide: APP_PIPE,
      useValue: new ValidationPipe({
        whitelist: true,
        forbidNonWhitelisted: true,
        transform: true,
      }),
    },
  ],
})
export class AppModule implements NestModule {
  configure(consumer: MiddlewareConsumer): void {
    consumer
      .apply(CorrelationIdMiddleware, JwtPayloadMiddleware)
      .forRoutes('*path');
  }
}
