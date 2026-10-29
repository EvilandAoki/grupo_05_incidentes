import { IncidentEvent } from '../../domain/events/incident-event';

export const EVENT_PUBLISHER = Symbol('EVENT_PUBLISHER');

export interface EventPublisher {
  /** Publica el evento y devuelve el `message_id` asignado por el broker. */
  publish(event: IncidentEvent<string, unknown>): Promise<string>;
}
