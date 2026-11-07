import { Module } from '@nestjs/common';
import { RatingsService } from './ratings.service.js';

@Module({
  providers: [RatingsService]
})
export class RatingsModule {}
