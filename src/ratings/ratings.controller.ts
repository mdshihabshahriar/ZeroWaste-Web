import { Body, Controller, Post } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { CurrentUser } from '../common/decorators/current-user.decorator.js'; 
import { Roles } from '../common/decorators/roles.decorator.js'; 
import { UserRole } from '../users/entities/user.entity.js'; 
import { CreateRatingDto } from './dto/create-rating.dto.js';
import { RatingsService } from './ratings.service.js';
 
@ApiTags('ratings')
@ApiBearerAuth()
@Controller('ratings')
export class RatingsController {
  constructor(private readonly service: RatingsService) {}
 
  @Post()
  @Roles(UserRole.DONOR, UserRole.VOLUNTEER)
  create(@CurrentUser() user: { id: number }, @Body() dto: CreateRatingDto) {
    return this.service.create(user.id, dto);
  }
}
