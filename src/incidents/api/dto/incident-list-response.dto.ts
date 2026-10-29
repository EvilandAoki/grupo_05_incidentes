import { ApiProperty } from '@nestjs/swagger';
import { IncidentListSummaryDto } from './incident-list-summary.dto';
import { IncidentResponseDto } from './incident-response.dto';

export class IncidentListResponseDto {
  @ApiProperty({ type: [IncidentResponseDto] })
  content: IncidentResponseDto[];

  @ApiProperty({ example: 0 })
  page: number;

  @ApiProperty({ example: 20 })
  size: number;

  @ApiProperty({ example: 1 })
  total: number;

  @ApiProperty({ type: IncidentListSummaryDto })
  summary: IncidentListSummaryDto;
}
