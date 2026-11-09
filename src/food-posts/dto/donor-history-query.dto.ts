import { ApiPropertyOptional } from '@nestjs/swagger';

import { Type } from 'class-transformer';

import { IsDateString, IsEnum, IsInt, IsOptional, Max, Min } from 'class-validator';

import { FoodPostStatus } from '../entities/food-posts.entity.js';
 
export class DonorHistoryQueryDto {

  @ApiPropertyOptional({ enum: FoodPostStatus }) @IsOptional() @IsEnum(FoodPostStatus)

  status?: FoodPostStatus;
 
  @ApiPropertyOptional() @IsOptional() @IsDateString()

  from?: string;
 
  @ApiPropertyOptional() @IsOptional() @IsDateString()

  to?: string;
 
  @ApiPropertyOptional({ default: 1 }) @IsOptional() @Type(() => Number) @IsInt() @Min(1)

  page: number = 1;
 
  @ApiPropertyOptional({ default: 10 }) @IsOptional() @Type(() => Number) @IsInt() @Min(1) @Max(50)

  limit: number = 10;

}
 