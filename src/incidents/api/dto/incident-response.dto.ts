import { ApiProperty } from '@nestjs/swagger';
import { Severity } from '../../domain/severity';

export class IncidentResponseDto {
  @ApiProperty({ format: 'uuid' })
  id: string;

  @ApiProperty({ format: 'uuid' })
  assignment_id: string;

  @ApiProperty({ enum: Severity })
  severity: Severity;

  @ApiProperty()
  description: string;

  @ApiProperty({ example: 'reported' })
  status: string;

  @ApiProperty({ format: 'date-time', example: '2026-10-28T09:30:00-05:00' })
  reported_at: string;

  @ApiProperty({ format: 'date-time', example: '2026-10-28T09:30:05-05:00' })
  created_at: string;
}
