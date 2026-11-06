import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { FoodPost } from './entities/food-posts.entity.js';
 
@Module({
  imports: [TypeOrmModule.forFeature([FoodPost])],
  exports: [TypeOrmModule],
})
export class FoodPostsModule {}