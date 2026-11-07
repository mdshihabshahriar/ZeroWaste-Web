
import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { NotificationsModule } from '../notifications/notifications.module.js';
import { StatusHistoryModule } from '../status-history/status-history.module.js';
import { UploadsModule } from '../uploads/uploads.module.js';

import { FoodPost } from './entities/food-posts.entity.js';
import { FoodPostsController } from './food-posts.controller.js';
import { FoodPostsService } from './food-posts.service.js';
import { FoodPostsExpirationService } from './food-posts-expiration.service.js';

@Module({
  imports: [
    TypeOrmModule.forFeature([FoodPost]),
    StatusHistoryModule,
    NotificationsModule,
    UploadsModule,
  ],
  controllers: [FoodPostsController],
  providers: [
    FoodPostsService,
    FoodPostsExpirationService,
  ],
  exports: [TypeOrmModule, FoodPostsService],
})
export class FoodPostsModule {}
