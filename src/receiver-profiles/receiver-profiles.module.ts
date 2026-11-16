import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ReceiverProfile } from './entities/receiver-profile.entity.js';
import { ReceiverProfilesController } from './receiver-profiles.controller.js';
import { ReceiverProfilesService } from './receiver-profiles.service.js';

@Module({
  imports: [TypeOrmModule.forFeature([ReceiverProfile])],
  controllers: [ReceiverProfilesController],
  providers: [ReceiverProfilesService],
  exports: [TypeOrmModule, ReceiverProfilesService],
})
export class ReceiverProfilesModule {}