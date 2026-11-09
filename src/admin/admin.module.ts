import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AuditLogsModule } from '../audit-logs/audit-logs.module.js';
import { FoodPost } from '../food-posts/entities/food-posts.entity.js';
import { Report } from '../reports/entities/report.entity.js';
import { User } from '../users/entities/user.entity.js';
import { AdminModerationController } from './admin-moderation.controller.js';
import { AdminModerationService } from './admin-moderation.service.js';
import { AdminStatsController } from './admin-stats.controller.js';
import { AdminStatsService } from './admin-stats.service.js';

@Module({
  imports: [TypeOrmModule.forFeature([User, FoodPost, Report]), AuditLogsModule],
  controllers: [AdminModerationController, AdminStatsController],
  providers: [AdminModerationService, AdminStatsService],
})
export class AdminModule {}