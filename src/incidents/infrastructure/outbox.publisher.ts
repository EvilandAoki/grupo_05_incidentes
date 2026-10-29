import { Injectable, NotImplementedException } from '@nestjs/common';

// TODO(HU_FLEETOPS_INC_04): tarea periódica (@nestjs/schedule) que lee outbox_events pendientes,
// publica con EventPublisher, marca `message_id`/`published_at` o incrementa `attempts`.
@Injectable()
export class OutboxPublisher {
  publishPending(): Promise<void> {
    return Promise.reject(
      new NotImplementedException('OutboxPublisher.publishPending'),
    );
  }
}
