import { ApiProperty } from '@nestjs/swagger';

export class SeverityCountsDto {
  @ApiProperty({ example: 3 })
  minor: number;

  @ApiProperty({ example: 1 })
  severe: number;
}

export class IncidentListSummaryDto {
  @ApiProperty({ type: SeverityCountsDto })
  by_severity: SeverityCountsDto;
}
