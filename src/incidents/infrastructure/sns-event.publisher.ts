import { Injectable, NotImplementedException } from '@nestjs/common';
import { IncidentEvent } from '../domain/events/incident-event';
import { EventPublisher } from '../application/ports/event.publisher.port';

// TODO(HU_FLEETOPS_INC_04): PublishCommand al topic SNS_TOPIC_ARN con el atributo `event_type`.
@Injectable()
export class SnsEventPublisher implements EventPublisher {
  publish(_event: IncidentEvent<string, unknown>): Promise<string> {
    return Promise.reject(
      new NotImplementedException('SnsEventPublisher.publish'),
    );
  }
}
