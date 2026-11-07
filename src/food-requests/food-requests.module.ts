import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { FoodRequest } from './entities/food-request.entity.js';
import { FoodRequestsService } from './food-requests.service.js';
import { FoodRequestsController } from './food-requests.controller.js';
import { StatusHistoryModule } from '../status-history/status-history.module.js';
import { NotificationsModule } from '../notifications/notifications.module.js';

@Module({
  imports: [
    TypeOrmModule.forFeature([FoodRequest]),
    StatusHistoryModule,
    NotificationsModule,
  ],
  controllers: [FoodRequestsController],
  providers: [FoodRequestsService],
  exports: [FoodRequestsService],
})
export class FoodRequestsModule {}