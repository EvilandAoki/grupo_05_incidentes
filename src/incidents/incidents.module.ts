import { HttpModule } from '@nestjs/axios';
import { Module } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { IncidentsController } from './api/incidents.controller';
import { IncidentService } from './application/incident.service';
import { ASSIGNMENTS_GATEWAY } from './application/ports/assignments.gateway.port';
import { EVENT_PUBLISHER } from './application/ports/event.publisher.port';
import { INCIDENT_REPOSITORY } from './application/ports/incident.repository.port';
import { VEHICLES_GATEWAY } from './application/ports/vehicles.gateway.port';
import { IncidentEventFactory } from './domain/incident-event.factory';
import { AssignmentsHttpClient } from './infrastructure/assignments-http.client';
import { OutboxPublisher } from './infrastructure/outbox.publisher';
import { PrismaIncidentRepository } from './infrastructure/prisma-incident.repository';
import { SnsEventPublisher } from './infrastructure/sns-event.publisher';
import { VehiclesHttpClient } from './infrastructure/vehicles-http.client';

@Module({
  imports: [
    HttpModule.registerAsync({
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        timeout: config.get<number>('HTTP_TIMEOUT_MS'),
      }),
    }),
  ],
  controllers: [IncidentsController],
  providers: [
    IncidentService,
    IncidentEventFactory,
    OutboxPublisher,
    { provide: INCIDENT_REPOSITORY, useClass: PrismaIncidentRepository },
    { provide: ASSIGNMENTS_GATEWAY, useClass: AssignmentsHttpClient },
    { provide: VEHICLES_GATEWAY, useClass: VehiclesHttpClient },
    { provide: EVENT_PUBLISHER, useClass: SnsEventPublisher },
  ],
})
export class IncidentsModule {}
