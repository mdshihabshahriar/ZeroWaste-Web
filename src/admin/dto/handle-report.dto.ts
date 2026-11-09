import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsIn, IsOptional, IsString, MaxLength } from 'class-validator';
import { ReportStatus } from '../../reports/entities/report.entity.js';

export class HandleReportDto {
  @ApiProperty({ enum: [ReportStatus.RESOLVED, ReportStatus.DISMISSED] })
  @IsIn([ReportStatus.RESOLVED, ReportStatus.DISMISSED])
  status: ReportStatus;

  @ApiPropertyOptional({ example: 'Donor ke warning deya hoyeche' })
  @IsOptional() @IsString() @MaxLength(500)
  note?: string;
}