import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsInt, IsString, MaxLength, MinLength } from 'class-validator';

export class CreateReportDto {
  @ApiProperty({ example: 12 })
  @Type(() => Number) @IsInt()
  postId: number;

  @ApiProperty({ example: 'Photo ar address mile na, mone hocche fake post' })
  @IsString() @MinLength(10) @MaxLength(500)
  reason: string;
}