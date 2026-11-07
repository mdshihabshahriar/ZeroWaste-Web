import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { FoodPost } from '../food-posts/entities/food-posts.entity.js';
import { NotificationsModule } from '../notifications/notifications.module.js';
import { Rating } from './entities/rating.entity.js';
import { RatingsController } from './ratings.controller.js';
import { RatingsService } from './ratings.service.js';
 
@Module({
  imports: [TypeOrmModule.forFeature([Rating, FoodPost]), NotificationsModule],
  controllers: [RatingsController],
  providers: [RatingsService],
})
export class RatingsModule {}