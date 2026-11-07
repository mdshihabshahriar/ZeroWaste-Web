
import { Injectable } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { DataSource } from 'typeorm';

import { StatusHistoryService } from '../status-history/status-history.service.js';
import {
  FoodPost,
  FoodPostStatus,
} from './entities/food-posts.entity.js';

@Injectable()
export class FoodPostsExpirationService {
  constructor(
    private readonly dataSource: DataSource,
    private readonly statusHistory: StatusHistoryService,
  ) {}

  // Automatically expire overdue, unaccepted food posts every minute.
  @Cron(CronExpression.EVERY_MINUTE)
  async expireOverdueFoodPosts() {
    return this.dataSource.transaction(async (manager) => {
      const repo = manager.getRepository(FoodPost);

      // Lock eligible rows so multiple server instances
      // cannot expire the same post simultaneously.
      const overduePosts = await repo
        .createQueryBuilder('post')
        .where('post.status = :status', {
          status: FoodPostStatus.POSTED,
        })
        .andWhere('post.pickupDeadline <= CURRENT_TIMESTAMP')
        .orderBy('post.pickupDeadline', 'ASC')
        .limit(500)
        .setLock('pessimistic_write')
        .setOnLocked('skip_locked')
        .getMany();

      for (const post of overduePosts) {
        post.status = FoodPostStatus.EXPIRED;

        await repo.save(post);

        // null means the status change was made automatically
        // by the system scheduler, not by a user.
        await this.statusHistory.log(
          post.id,
          FoodPostStatus.POSTED,
          FoodPostStatus.EXPIRED,
          null,
          manager,
        );
      }

      return {
        expiredCount: overduePosts.length,
      };
    });
  }
}
