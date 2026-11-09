import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { StatusHistory } from './entities/status-history.entity.js';
import { StatusHistoryService } from './status-history.service.js';
import { StatusHistoryController } from './status-history.controller.js';
 
@Module({
  imports: [TypeOrmModule.forFeature([StatusHistory])],
  providers: [StatusHistoryService],
  exports: [StatusHistoryService],
  controllers: [StatusHistoryController], 
})
export class StatusHistoryModule {}
