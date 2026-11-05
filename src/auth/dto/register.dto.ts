import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsEmail, IsIn, IsLatitude, IsLongitude, IsOptional, IsString, Matches, MaxLength, MinLength,
} from 'class-validator';
import { UserRole } from '../../users/entities/user.entity.js';

export class RegisterDto {
  @ApiProperty({ example: 'Rahim Uddin' })
  @IsString() @MinLength(2) @MaxLength(100)
  name: string;

  @ApiProperty({ example: 'rahim@example.com' })
  @IsEmail()
  email: string;

  @ApiProperty({ example: 'secret123' })
  @IsString() @MinLength(6) @MaxLength(64)
  password: string;

  @ApiProperty({ enum: [UserRole.DONOR, UserRole.VOLUNTEER, UserRole.RECEIVER] })
  @IsIn([UserRole.DONOR, UserRole.VOLUNTEER, UserRole.RECEIVER], {
    message: 'role must be donor, volunteer or receiver',
  })
  role: UserRole;

  @ApiPropertyOptional({ example: '01712345678' })
  @IsOptional() @Matches(/^\+?[0-9]{7,15}$/, { message: 'phone is not valid' })
  phone?: string;

  @ApiPropertyOptional({ example: 'Mirpur 10, Dhaka' })
  @IsOptional() @IsString()
  address?: string;

  @ApiPropertyOptional({ example: 23.8069 })
  @IsOptional() @IsLatitude()
  latitude?: number;

  @ApiPropertyOptional({ example: 90.3687 })
  @IsOptional() @IsLongitude()
  longitude?: number;
}