import { Controller, Get, Param, ParseIntPipe, Patch, Query } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { CurrentUser } from '../common/decorators/current-user.decorator.js';
import { Roles } from '../common/decorators/roles.decorator.js';
import { PaginationDto } from '../common/dto/pagination.dto.js';
import { UserRole } from '../users/entities/user.entity.js';
import { AdminUsersService } from './admin-users.service.js';
import { ListUsersDto } from './dto/list-users.dto.js';

@ApiTags('Admin')
@ApiBearerAuth()
@Roles(UserRole.ADMIN)
@Controller('admin/users')
export class AdminUsersController {
  constructor(private service: AdminUsersService) {}

  @Get()
  list(@Query() q: ListUsersDto) {
    return this.service.list(q);
  }

  @Get('pending')
  pending(@Query() q: PaginationDto) {
    return this.service.pending(q);
  }

  @Patch(':id/verify')
  verify(@CurrentUser('id') adminId: number, @Param('id', ParseIntPipe) id: number) {
    return this.service.verify(adminId, id);
  }

  @Patch(':id/reject')
  reject(@CurrentUser('id') adminId: number, @Param('id', ParseIntPipe) id: number) {
    return this.service.reject(adminId, id);
  }

  @Patch(':id/ban')
  ban(@CurrentUser('id') adminId: number, @Param('id', ParseIntPipe) id: number) {
    return this.service.ban(adminId, id);
  }

  @Patch(':id/unban')
  unban(@CurrentUser('id') adminId: number, @Param('id', ParseIntPipe) id: number) {
    return this.service.unban(adminId, id);
  }
}