import { Body, Controller, Get, Param, ParseIntPipe, Patch, Query } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { CurrentUser } from '../common/decorators/current-user.decorator.js';
import { Roles } from '../common/decorators/roles.decorator.js';
import { UserRole } from '../users/entities/user.entity.js';
import { AdminModerationService } from './admin-moderation.service.js';
import { HandleReportDto } from './dto/handle-report.dto.js';
import { ListPostsDto } from './dto/list-posts.dto.js';
import { ListReportsDto } from './dto/list-reports.dto.js';
import { RemovePostDto } from './dto/remove-post.dto.js';

@ApiTags('Admin')
@ApiBearerAuth()
@Roles(UserRole.ADMIN)
@Controller('admin')
export class AdminModerationController {
  constructor(private service: AdminModerationService) {}

  @Get('reports')
  listReports(@Query() q: ListReportsDto) {
    return this.service.listReports(q);
  }

  @Patch('reports/:id')
  handleReport(
    @CurrentUser('id') adminId: number,
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: HandleReportDto,
  ) {
    return this.service.handleReport(adminId, id, dto);
  }

  @Get('posts')
  listPosts(@Query() q: ListPostsDto) {
    return this.service.listPosts(q);
  }

  @Patch('posts/:id/remove')
  removePost(
    @CurrentUser('id') adminId: number,
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: RemovePostDto,
  ) {
    return this.service.removePost(adminId, id, dto);
  }
}