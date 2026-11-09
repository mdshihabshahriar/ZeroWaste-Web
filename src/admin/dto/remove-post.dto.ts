import { ApiProperty } from '@nestjs/swagger';
import { IsString, MaxLength, MinLength } from 'class-validator';

export class RemovePostDto {
  @ApiProperty({ example: 'Fake post, address vul' })
  @IsString() @MinLength(5) @MaxLength(300)
  reason: string;
}