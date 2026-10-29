import { NotImplementedException } from '@nestjs/common';
import { Severity } from '../domain/severity';
import { IncidentService } from './incident.service';

describe('placeholder 501 — borrar al implementar la HU', () => {
  const service = new IncidentService();

  // TODO(HU_FLEETOPS_INC_01): reemplazar por pruebas reales de esta HU (crear incidente).
  it('IncidentService.create responde 501', async () => {
    await expect(
      service.create({
        assignmentId: 'a',
        severity: Severity.Minor,
        description: 'd',
        reportedAt: new Date(),
      }),
    ).rejects.toBeInstanceOf(NotImplementedException);
  });

  // TODO(HU_FLEETOPS_INC_05): reemplazar por pruebas reales de esta HU (consultar por id).
  it('IncidentService.findById responde 501', async () => {
    await expect(service.findById('id')).rejects.toBeInstanceOf(
      NotImplementedException,
    );
  });

  // TODO(HU_FLEETOPS_INC_06): reemplazar por pruebas reales de esta HU (listar con filtros).
  it('IncidentService.list responde 501', async () => {
    await expect(service.list({ page: 0, size: 20 })).rejects.toBeInstanceOf(
      NotImplementedException,
    );
  });
});
