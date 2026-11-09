import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsEnum, IsOptional } from 'class-validator';
import { PaginationDto } from '../../common/dto/pagination.dto.js';
import { FoodPostStatus } from '../../food-posts/entities/food-posts.entity.js';

export class ListPostsDto extends PaginationDto {
  @ApiPropertyOptional({ enum: FoodPostStatus })
  @IsOptional() @IsEnum(FoodPostStatus)
  status?: FoodPostStatus;
}