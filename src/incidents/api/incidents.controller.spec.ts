import { NotImplementedException } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import type { Response } from 'express';
import { IncidentService } from '../application/incident.service';
import { Incident } from '../domain/incident';
import { Severity } from '../domain/severity';
import { CreateIncidentDto } from './dto/create-incident.dto';
import { ListIncidentsQueryDto } from './dto/list-incidents-query.dto';
import { IncidentsController } from './incidents.controller';

describe('IncidentsController', () => {
  const incident: Incident = {
    id: '11111111-1111-4111-8111-111111111111',
    assignmentId: '22222222-2222-4222-8222-222222222222',
    severity: Severity.Severe,
    description: 'Colisión',
    status: 'reported',
    reportedAt: new Date('2026-10-28T14:30:00.000Z'),
    createdAt: new Date('2026-10-28T14:30:05.000Z'),
  };
  const expectedResponse = {
    incident_id: incident.id,
    assignment_id: incident.assignmentId,
    severity: 'severe',
    description: 'Colisión',
    status: 'reported',
    reported_at: '2026-10-28T09:30:00.000-05:00',
    created_at: '2026-10-28T09:30:05.000-05:00',
  };

  let controller: IncidentsController;
  let service: jest.Mocked<IncidentService>;
  let res: { location: jest.Mock };

  beforeEach(async () => {
    const moduleRef = await Test.createTestingModule({
      controllers: [IncidentsController],
      providers: [
        {
          provide: IncidentService,
          useValue: { create: jest.fn(), findById: jest.fn(), list: jest.fn() },
        },
      ],
    }).compile();

    controller = moduleRef.get(IncidentsController);
    service = moduleRef.get(IncidentService);
    res = { location: jest.fn() };
  });

  it('create delega en el servicio, responde incident_id y fija Location', async () => {
    service.create.mockResolvedValue(incident);
    const dto: CreateIncidentDto = {
      assignment_id: incident.assignmentId,
      severity: Severity.Severe,
      description: 'Colisión',
      reported_at: '2026-10-28T09:30:00-05:00',
    };

    await expect(
      controller.create(dto, res as unknown as Response),
    ).resolves.toEqual(expectedResponse);
    expect(res.location).toHaveBeenCalledWith(`/incidents/${incident.id}`);
    expect(service.create).toHaveBeenCalledWith({
      assignmentId: incident.assignmentId,
      severity: Severity.Severe,
      description: 'Colisión',
      reportedAt: new Date('2026-10-28T14:30:00.000Z'),
    });
  });

  it('create propaga el 501 del servicio', async () => {
    service.create.mockRejectedValue(new NotImplementedException());

    await expect(
      controller.create(
        {
          assignment_id: incident.assignmentId,
          severity: Severity.Minor,
          description: 'x',
          reported_at: '2026-10-28T09:30:00-05:00',
        },
        res as unknown as Response,
      ),
    ).rejects.toBeInstanceOf(NotImplementedException);
    expect(res.location).not.toHaveBeenCalled();
  });

  it('findById delega en el servicio', async () => {
    service.findById.mockResolvedValue(incident);

    await expect(controller.findById(incident.id)).resolves.toEqual(
      expectedResponse,
    );
    expect(service.findById).toHaveBeenCalledWith(incident.id);
  });

  it('list convierte filtros y arma la página', async () => {
    service.list.mockResolvedValue({
      content: [incident],
      total: 1,
      summary: { bySeverity: { minor: 4, severe: 1 } },
    });
    const query: ListIncidentsQueryDto = {
      assignment_id: incident.assignmentId,
      severity: Severity.Severe,
      reported_from: '2026-10-01T00:00:00-05:00',
      reported_to: '2026-10-31T23:59:59-05:00',
      page: 0,
      size: 20,
    };

    await expect(controller.list(query)).resolves.toEqual({
      content: [expectedResponse],
      page: 0,
      size: 20,
      total: 1,
      summary: { by_severity: { minor: 4, severe: 1 } },
    });
    expect(service.list).toHaveBeenCalledWith({
      assignmentId: incident.assignmentId,
      severity: Severity.Severe,
      reportedFrom: new Date('2026-10-01T05:00:00.000Z'),
      reportedTo: new Date('2026-11-01T04:59:59.000Z'),
      page: 0,
      size: 20,
    });
  });

  it('list sin filtros no envía fechas', async () => {
    service.list.mockResolvedValue({
      content: [],
      total: 0,
      summary: { bySeverity: { minor: 0, severe: 0 } },
    });

    await controller.list({ page: 1, size: 5 });

    expect(service.list).toHaveBeenCalledWith({
      assignmentId: undefined,
      severity: undefined,
      reportedFrom: undefined,
      reportedTo: undefined,
      page: 1,
      size: 5,
    });
  });
});
