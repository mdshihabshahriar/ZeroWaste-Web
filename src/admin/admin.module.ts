import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AuditLogsModule } from '../audit-logs/audit-logs.module.js';
import { FoodPost } from '../food-posts/entities/food-posts.entity.js';
import { ReceiverProfile } from '../receiver-profiles/entities/receiver-profile.entity.js';
import { Report } from '../reports/entities/report.entity.js';
import { User } from '../users/entities/user.entity.js';
import { AdminModerationController } from './admin-moderation.controller.js';
import { AdminModerationService } from './admin-moderation.service.js';
import { AdminStatsController } from './admin-stats.controller.js';
import { AdminStatsService } from './admin-stats.service.js';
import { AdminUsersController } from './admin-users.controller.js';
import { AdminUsersService } from './admin-users.service.js';

@Module({
  imports: [
    TypeOrmModule.forFeature([User, FoodPost, Report, ReceiverProfile]),
    AuditLogsModule,
  ],
  controllers: [AdminModerationController, AdminStatsController, AdminUsersController],
  providers: [AdminModerationService, AdminStatsService, AdminUsersService],
})
export class AdminModule {}