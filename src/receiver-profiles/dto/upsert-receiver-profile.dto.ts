import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsInt, IsOptional, IsString, MaxLength, Min, MinLength } from 'class-validator';

export class UpsertReceiverProfileDto {
  @ApiProperty({ example: 'Hope Orphanage' })
  @IsString() @MinLength(2) @MaxLength(150)
  organisationName: string;

  @ApiPropertyOptional({ example: 'Orphanage' })
  @IsOptional() @IsString() @MaxLength(50)
  orgType?: string;

  @ApiPropertyOptional({ example: 100, description: 'Koto jon ke khabar dite pare' })
  @IsOptional() @Type(() => Number) @IsInt() @Min(1)
  capacity?: number;
}