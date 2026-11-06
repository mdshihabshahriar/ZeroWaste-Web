import { Controller, Get, Param, ParseIntPipe, Patch, Query } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { CurrentUser } from '../common/decorators/current-user.decorator.js'; // path adjust
import { NotificationsService } from './notifications.service.js';
 
@ApiTags('notifications')
@ApiBearerAuth()
@Controller('notifications')
export class NotificationsController {
  constructor(private readonly service: NotificationsService) {}
 
  @Get()
  findMine(
    @CurrentUser() user: { id: number },
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ) {
    return this.service.findMine(user.id, Number(page) || 1, Math.min(Number(limit) || 20, 50));
  }
 
  @Patch(':id/read')
  markRead(@Param('id', ParseIntPipe) id: number, @CurrentUser() user: { id: number }) {
    return this.service.markRead(id, user.id);
  }
}