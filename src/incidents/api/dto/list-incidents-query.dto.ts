import { ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  IsEnum,
  IsInt,
  IsISO8601,
  IsOptional,
  IsUUID,
  Max,
  Min,
} from 'class-validator';
import { Severity } from '../../domain/severity';

export class ListIncidentsQueryDto {
  @ApiPropertyOptional({ format: 'uuid' })
  @IsOptional()
  @IsUUID()
  assignment_id?: string;

  @ApiPropertyOptional({ enum: Severity })
  @IsOptional()
  @IsEnum(Severity)
  severity?: Severity;

  @ApiPropertyOptional({
    format: 'date-time',
    example: '2026-10-01T00:00:00-05:00',
  })
  @IsOptional()
  @IsISO8601({ strict: true, strictSeparator: true })
  reported_from?: string;

  @ApiPropertyOptional({
    format: 'date-time',
    example: '2026-10-31T23:59:59-05:00',
  })
  @IsOptional()
  @IsISO8601({ strict: true, strictSeparator: true })
  reported_to?: string;

  // TODO(HU_FLEETOPS_INC_03): confirmar con el DAS si `page` empieza en 0 o en 1.
  @ApiPropertyOptional({ minimum: 0, default: 0 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  page: number = 0;

  @ApiPropertyOptional({ minimum: 1, maximum: 100, default: 20 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(100)
  size: number = 20;
}
