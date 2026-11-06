import { Module } from '@nestjs/common';
import { StatusHistoryService } from './status-history.service.js';

@Module({
  providers: [StatusHistoryService]
})
export class StatusHistoryModule {}
