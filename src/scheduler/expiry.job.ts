import { Injectable, Logger } from '@nestjs/common';

import { Cron, CronExpression } from '@nestjs/schedule';

import { DataSource } from 'typeorm';

import { FoodPost, FoodPostStatus } from '../food-posts/entities/food-posts.entity.js';

import { NotificationsService } from '../notifications/notifications.service.js';

import { StatusHistoryService } from '../status-history/status-history.service.js';
 
@Injectable()

export class ExpiryJob {

  private readonly logger = new Logger(ExpiryJob.name);
 
  constructor(

    private readonly dataSource: DataSource,

    private readonly statusHistory: StatusHistoryService,

    private readonly notifications: NotificationsService,

  ) {}
 
  @Cron(CronExpression.EVERY_MINUTE)

  async expireOverduePosts() {

    await this.dataSource.transaction(async (manager) => {

      const res = await manager

        .createQueryBuilder()

        .update(FoodPost)

        .set({ status: FoodPostStatus.EXPIRED })

        .where('status = :s AND "pickupDeadline" < NOW()', { s: FoodPostStatus.POSTED })

        .returning(['id', 'donorId'])

        .execute();
 
      const rows = res.raw as { id: number; donorId: number }[];

      for (const row of rows) {

        await this.statusHistory.log(row.id, FoodPostStatus.POSTED, FoodPostStatus.EXPIRED, null, manager);

        await this.notifications.create(

          row.donorId,

          `Your food post #${row.id} expired because nobody accepted it before the deadline.`,

          manager,

        );

      }

      if (rows.length) this.logger.log(`Expired ${rows.length} post(s)`);

    });

  }

}
 