import { ApiProperty } from '@nestjs/swagger';
import {
  IsEnum,
  IsISO8601,
  IsNotEmpty,
  IsString,
  IsUUID,
  MaxLength,
} from 'class-validator';
import { Severity } from '../../domain/severity';

export class CreateIncidentDto {
  @ApiProperty({
    format: 'uuid',
    example: '3f2b8c1e-5a7d-4e0b-9c64-1d2e3f4a5b6c',
  })
  @IsUUID()
  assignment_id: string;

  @ApiProperty({ enum: Severity, example: Severity.Minor })
  @IsEnum(Severity)
  severity: Severity;

  @ApiProperty({ maxLength: 2000, example: 'Llanta pinchada en la vía' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(2000)
  description: string;

  @ApiProperty({ format: 'date-time', example: '2026-10-28T09:30:00-05:00' })
  @IsISO8601({ strict: true, strictSeparator: true })
  reported_at: string;
}
