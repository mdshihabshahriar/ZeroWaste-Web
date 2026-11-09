import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { FoodPost } from '../food-posts/entities/food-posts.entity.js';
import { StatusHistory } from './entities/status-history.entity.js';
import { StatusHistoryController } from './status-history.controller.js';
import { StatusHistoryService } from './status-history.service.js';
 
@Module({
  imports: [TypeOrmModule.forFeature([StatusHistory, FoodPost])],
  controllers: [StatusHistoryController],
  providers: [StatusHistoryService],
  exports: [StatusHistoryService],
})
export class StatusHistoryModule {}