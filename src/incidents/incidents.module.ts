import { Module } from '@nestjs/common';
import { IncidentsController } from './api/incidents.controller';
import { IncidentService } from './application/incident.service';
import { ASSIGNMENTS_CLIENT } from './application/ports/assignments.client.port';
import { EVENT_PUBLISHER } from './application/ports/event.publisher.port';
import { INCIDENT_REPOSITORY } from './application/ports/incident.repository.port';
import { VEHICLES_CLIENT } from './application/ports/vehicles.client.port';
import { IncidentEventFactory } from './domain/incident-event.factory';
import { AssignmentsHttpClient } from './infrastructure/assignments-http.client';
import { OutboxPublisher } from './infrastructure/outbox.publisher';
import { PrismaIncidentRepository } from './infrastructure/prisma-incident.repository';
import { SnsEventPublisher } from './infrastructure/sns-event.publisher';
import { VehiclesHttpClient } from './infrastructure/vehicles-http.client';

@Module({
  controllers: [IncidentsController],
  providers: [
    IncidentService,
    IncidentEventFactory,
    OutboxPublisher,
    { provide: INCIDENT_REPOSITORY, useClass: PrismaIncidentRepository },
    { provide: ASSIGNMENTS_CLIENT, useClass: AssignmentsHttpClient },
    { provide: VEHICLES_CLIENT, useClass: VehiclesHttpClient },
    { provide: EVENT_PUBLISHER, useClass: SnsEventPublisher },
  ],
})
export class IncidentsModule {}
