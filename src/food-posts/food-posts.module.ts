import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { FoodPost } from './entities/food-posts.entity.js';
import { FoodPostsService } from './food-posts.service.js';
import { FoodPostsController } from './food-posts.controller.js';
 
@Module({
  imports: [TypeOrmModule.forFeature([FoodPost])],
  exports: [TypeOrmModule],
  providers: [FoodPostsService],
  controllers: [FoodPostsController],
})
export class FoodPostsModule {}