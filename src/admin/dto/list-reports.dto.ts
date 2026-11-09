import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsEnum, IsOptional } from 'class-validator';
import { PaginationDto } from '../../common/dto/pagination.dto.js';
import { ReportStatus } from '../../reports/entities/report.entity.js';

export class ListReportsDto extends PaginationDto {
  @ApiPropertyOptional({ enum: ReportStatus })
  @IsOptional() @IsEnum(ReportStatus)
  status?: ReportStatus;
}