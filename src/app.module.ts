
import 'dotenv/config';

import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { APP_GUARD } from '@nestjs/core';
import { ThrottlerGuard, ThrottlerModule } from '@nestjs/throttler';
import { ScheduleModule } from '@nestjs/schedule';

import { UsersModule } from './users/users.module.js';
import { ReceiverProfilesModule } from './receiver-profiles/receiver-profiles.module.js';
import { AuditLogsModule } from './audit-logs/audit-logs.module.js';
import { AuthModule } from './auth/auth.module.js';

import { FoodPostsModule } from './food-posts/food-posts.module.js';
import { StatusHistoryModule } from './status-history/status-history.module.js';
import { NotificationsModule } from './notifications/notifications.module.js';
import { UploadsModule } from './uploads/uploads.module.js';
import { FoodRequestsModule } from './food-requests/food-requests.module.js';
import { SchedulerModule } from './scheduler/scheduler.module.js';
import { RatingsModule } from './ratings/ratings.module.js';

import { ReportsModule } from './reports/reports.module.js';

@Module({
  imports: [
    ScheduleModule.forRoot(),

    ThrottlerModule.forRoot([
      {
        ttl: 60000,
        limit: 100,
      },
    ]),

    TypeOrmModule.forRoot({
      type: 'postgres',
      host: process.env.DB_HOST,
      port: Number(process.env.DB_PORT),
      username: process.env.DB_USER,
      password: process.env.DB_PASSWORD,
      database: process.env.DB_NAME,
      autoLoadEntities: true,
      synchronize: true,
    }),

    UsersModule,
    ReceiverProfilesModule,
    AuditLogsModule,
    AuthModule,

    FoodPostsModule,
    StatusHistoryModule,
    NotificationsModule,
    UploadsModule,
    FoodRequestsModule,
    SchedulerModule,
    RatingsModule,

    ReportsModule,
  ],

  providers: [
    {
      provide: APP_GUARD,
      useClass: ThrottlerGuard,
    },
  ],
})
export class AppModule {}
