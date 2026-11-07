import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { FoodRequest } from './entities/food-request.entity.js';
import { FoodRequestsService } from './food-requests.service.js';
import { FoodRequestsController } from './food-requests.controller.js';

@Module({
  imports: [TypeOrmModule.forFeature([FoodRequest])],
  providers: [FoodRequestsService],
  exports: [FoodRequestsService],
  controllers: [FoodRequestsController],
})
export class FoodRequestsModule {}