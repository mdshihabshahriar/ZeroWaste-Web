
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  IsDateString,
  IsInt,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  Max,
  MaxLength,
  Min,
} from 'class-validator';

export class CreateFoodPostDto {
  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  @MaxLength(150)
  title: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(1000)
  description?: string;

  @ApiProperty({ example: 'Cooked rice' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(50)
  foodType: string;

  @ApiProperty({ example: 40 })
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(10000)
  portions: number;

  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  @MaxLength(255)
  address: string;

  @ApiProperty({ example: 23.8103 })
  @Type(() => Number)
  @IsNumber()
  @Min(-90)
  @Max(90)
  latitude: number;

  @ApiProperty({ example: 90.4125 })
  @Type(() => Number)
  @IsNumber()
  @Min(-180)
  @Max(180)
  longitude: number;

  @ApiProperty({ example: '2026-11-07T23:00:00.000Z' })
  @IsDateString()
  pickupDeadline: string;

  @ApiPropertyOptional({ type: 'string', format: 'binary' })
  @IsOptional()
  photo?: any;
}
