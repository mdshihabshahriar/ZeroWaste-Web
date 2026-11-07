import { Module } from '@nestjs/common';

import { NotificationsModule } from '../notifications/notifications.module.js';

import { StatusHistoryModule } from '../status-history/status-history.module.js';

import { ExpiryJob } from './expiry.job.js';
 
@Module({

  imports: [StatusHistoryModule, NotificationsModule],

  providers: [ExpiryJob],

})

export class SchedulerModule {}
 