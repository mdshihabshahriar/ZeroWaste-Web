import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ReceiverProfile } from './entities/receiver-profile.entity.js';

@Module({
  imports: [TypeOrmModule.forFeature([ReceiverProfile])],
  exports: [TypeOrmModule],
})
export class ReceiverProfilesModule {}