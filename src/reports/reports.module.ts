import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { FoodPost } from '../food-posts/entities/food-posts.entity.js';
import { Report } from './entities/report.entity.js';
import { ReportsController } from './reports.controller.js';
import { ReportsService } from './reports.service.js';

@Module({
  imports: [TypeOrmModule.forFeature([Report, FoodPost])],
  controllers: [ReportsController],
  providers: [ReportsService],
  exports: [TypeOrmModule],
})
export class ReportsModule {}