import { Body, Controller, Get, Put } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { CurrentUser } from '../common/decorators/current-user.decorator.js';
import { Roles } from '../common/decorators/roles.decorator.js';
import { UserRole } from '../users/entities/user.entity.js';
import { UpsertReceiverProfileDto } from './dto/upsert-receiver-profile.dto.js';
import { ReceiverProfilesService } from './receiver-profiles.service.js';

@ApiTags('Receiver Profile')
@ApiBearerAuth()
@Roles(UserRole.RECEIVER)
@Controller('receiver-profiles')
export class ReceiverProfilesController {
  constructor(private service: ReceiverProfilesService) {}

  @Get('me')
  getMine(@CurrentUser('id') userId: number) {
    return this.service.getMine(userId);
  }

  @Put('me')
  upsert(@CurrentUser('id') userId: number, @Body() dto: UpsertReceiverProfileDto) {
    return this.service.upsertMine(userId, dto);
  }
}