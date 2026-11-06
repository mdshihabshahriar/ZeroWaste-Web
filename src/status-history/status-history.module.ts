import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { StatusHistory } from './entities/status-history.entity.js';
import { StatusHistoryService } from './status-history.service.js';
 
@Module({
  imports: [TypeOrmModule.forFeature([StatusHistory])],
  providers: [StatusHistoryService],
  exports: [StatusHistoryService], 
})
export class StatusHistoryModule {}
