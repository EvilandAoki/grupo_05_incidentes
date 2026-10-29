import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  ParseUUIDPipe,
  Post,
  Query,
} from '@nestjs/common';
import {
  ApiBody,
  ApiOkResponse,
  ApiOperation,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { IncidentService } from '../application/incident.service';
import { Incident, toBogotaIso } from '../domain/incident';
import { CreateIncidentDto } from './dto/create-incident.dto';
import { IncidentListResponseDto } from './dto/incident-list-response.dto';
import { IncidentResponseDto } from './dto/incident-response.dto';
import { ListIncidentsQueryDto } from './dto/list-incidents-query.dto';

function toResponse(incident: Incident): IncidentResponseDto {
  return {
    id: incident.id,
    assignment_id: incident.assignmentId,
    severity: incident.severity,
    description: incident.description,
    status: incident.status,
    reported_at: toBogotaIso(incident.reportedAt),
    created_at: toBogotaIso(incident.createdAt),
  };
}

@ApiTags('incidents')
@Controller('incidents')
export class IncidentsController {
  constructor(private readonly service: IncidentService) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Reportar un incidente' })
  @ApiBody({
    type: CreateIncidentDto,
    examples: {
      minor: {
        summary: 'Incidente leve',
        value: {
          assignment_id: '3f2b8c1e-5a7d-4e0b-9c64-1d2e3f4a5b6c',
          severity: 'minor',
          description: 'Llanta pinchada en la vía',
          reported_at: '2026-10-28T09:30:00-05:00',
        },
      },
      severe: {
        summary: 'Incidente grave',
        value: {
          assignment_id: '3f2b8c1e-5a7d-4e0b-9c64-1d2e3f4a5b6c',
          severity: 'severe',
          description: 'Colisión con otro vehículo, sin heridos',
          reported_at: '2026-10-28T09:45:00-05:00',
        },
      },
    },
  })
  @ApiResponse({ status: 201, type: IncidentResponseDto })
  @ApiResponse({ status: 400, description: 'validation_error' })
  @ApiResponse({ status: 501, description: 'not_implemented (arquetipo)' })
  async create(@Body() dto: CreateIncidentDto): Promise<IncidentResponseDto> {
    const incident = await this.service.create({
      assignmentId: dto.assignment_id,
      severity: dto.severity,
      description: dto.description,
      reportedAt: new Date(dto.reported_at),
    });
    return toResponse(incident);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Consultar un incidente por id' })
  @ApiOkResponse({ type: IncidentResponseDto })
  @ApiResponse({ status: 400, description: 'validation_error' })
  @ApiResponse({ status: 404, description: 'not_found' })
  @ApiResponse({ status: 501, description: 'not_implemented (arquetipo)' })
  async findById(
    @Param('id', ParseUUIDPipe) id: string,
  ): Promise<IncidentResponseDto> {
    return toResponse(await this.service.findById(id));
  }

  @Get()
  @ApiOperation({ summary: 'Listar incidentes con filtros y paginación' })
  @ApiOkResponse({ type: IncidentListResponseDto })
  @ApiResponse({ status: 400, description: 'validation_error' })
  @ApiResponse({ status: 501, description: 'not_implemented (arquetipo)' })
  async list(
    @Query() query: ListIncidentsQueryDto,
  ): Promise<IncidentListResponseDto> {
    const result = await this.service.list({
      assignmentId: query.assignment_id,
      severity: query.severity,
      reportedFrom: query.reported_from
        ? new Date(query.reported_from)
        : undefined,
      reportedTo: query.reported_to ? new Date(query.reported_to) : undefined,
      page: query.page,
      size: query.size,
    });
    return {
      content: result.content.map(toResponse),
      page: query.page,
      size: query.size,
      total: result.total,
    };
  }
}
