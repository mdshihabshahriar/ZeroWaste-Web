import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsInt, IsOptional, IsString, Max, MaxLength, Min } from 'class-validator';
 
export class CreateRatingDto {
  @ApiProperty() @IsInt() @Min(1)
  postId: number;
 
  @ApiProperty({ minimum: 1, maximum: 5 }) @IsInt() @Min(1) @Max(5)
  score: number;
 
  @ApiPropertyOptional() @IsOptional() @IsString() @MaxLength(500)
  comment?: string;
}