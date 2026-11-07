import { DataSource } from 'typeorm';
import { StatusHistoryService } from '../status-history/status-history.service.js';
import { NotificationsService } from '../notifications/notifications.service.js';
import { DonorHistoryQueryDto } from '../food-posts/dto/donor-history-query.dto.js';
import {
  Injectable,
  NotFoundException,
  ConflictException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { IsNull, MoreThan, Repository } from 'typeorm';
import {
  FoodRequest,
  FoodRequestStatus,
} from './entities/food-request.entity.js';
import {
  FoodPost,
  FoodPostStatus,
} from '../food-posts/entities/food-posts.entity.js';

@Injectable()
export class FoodRequestsService {
  constructor(
  @InjectRepository(FoodRequest)
  private readonly foodRequestRepo: Repository<FoodRequest>,
  private readonly dataSource: DataSource,
  private readonly statusHistory: StatusHistoryService,
  private readonly notifications: NotificationsService,
) {}

  // Browse available food donations as a receiver
  async browseAvailableFood() {
    return this.foodRequestRepo.manager
      .getRepository(FoodPost)
      .find({
        where: {
          status: FoodPostStatus.POSTED,
          receiverId: IsNull(),
          pickupDeadline: MoreThan(new Date()),
        },
        select: {
          id: true,
          title: true,
          description: true,
          foodType: true,
          portions: true,
          pickupDeadline: true,
          createdAt: true,
        },
        order: {
          createdAt: 'DESC',
        },
      });
  }

  // Request an available food donation
  async requestFood(postId: number, receiverId: number) {
    return this.foodRequestRepo.manager.transaction(async (manager) => {
      const postRepo = manager.getRepository(FoodPost);
      const requestRepo = manager.getRepository(FoodRequest);

      const post = await postRepo.findOne({
        where: { id: postId },
        lock: { mode: 'pessimistic_write' },
      });

      if (!post) {
        throw new NotFoundException('Food post not found');
      }

      if (post.status !== FoodPostStatus.POSTED) {
        throw new ConflictException(
          'This food donation is no longer available',
        );
      }

      if (post.pickupDeadline <= new Date()) {
        throw new ConflictException('The pickup deadline has passed');
      }

      if (post.receiverId !== null && post.receiverId !== undefined) {
        throw new ConflictException(
          'This food donation has already been assigned to another receiver',
        );
      }

      const existingRequest = await requestRepo.findOne({
        where: {
          postId,
          status: FoodRequestStatus.ACCEPTED,
        },
      });

      if (existingRequest) {
        throw new ConflictException(
          'This food donation has already been assigned to another receiver',
        );
      }

      const request = requestRepo.create({
        postId,
        receiverId,
        status: FoodRequestStatus.ACCEPTED,
      });

      await requestRepo.save(request);

      post.receiverId = receiverId;
      await postRepo.save(post);

      return request;
    });
  }

  // View food requests made by a receiver
  async findReceiverHistory(
    receiverId: number,
    q: DonorHistoryQueryDto,
  ) {
    const qb = this.foodRequestRepo
      .createQueryBuilder('request')
      .leftJoinAndSelect('request.post', 'post')
      .where('request.receiverId = :receiverId', { receiverId })
      .orderBy('request.requestedAt', 'DESC')
      .skip((q.page - 1) * q.limit)
      .take(q.limit);

    if (q.from) {
      qb.andWhere('request.requestedAt >= :from', { from: q.from });
    }

    if (q.to) {
      qb.andWhere('request.requestedAt <= :to', { to: q.to });
    }

    const [data, total] = await qb.getManyAndCount();

    return {
      data,
      meta: {
        page: q.page,
        limit: q.limit,
        total,
        totalPages: Math.ceil(total / q.limit),
      },
    };
  }

    // Receiver confirms that the food donation has been delivered
  async confirmDelivery(postId: number, receiverId: number) {
    return this.dataSource.transaction(async (manager) => {
      const postRepo = manager.getRepository(FoodPost);
      const requestRepo = manager.getRepository(FoodRequest);

      const post = await postRepo.findOne({
        where: { id: postId },
        lock: { mode: 'pessimistic_write' },
      });

      if (!post) {
        throw new NotFoundException('Food post not found');
      }

      if (post.receiverId !== receiverId) {
        throw new ConflictException(
          'Only the assigned receiver can confirm this delivery',
        );
      }

      if (post.status !== FoodPostStatus.PICKED_UP) {
        throw new ConflictException(
          'Only picked-up food donations can be confirmed as delivered',
        );
      }

      post.status = FoodPostStatus.DELIVERED;

      const updatedPost = await postRepo.save(post);

      const foodRequest = await requestRepo.findOne({
        where: {
          postId,
          receiverId,
          status: FoodRequestStatus.ACCEPTED,
        },
      });

      if (foodRequest) {
        foodRequest.status = FoodRequestStatus.DELIVERED;
        await requestRepo.save(foodRequest);
      }

      await this.statusHistory.log(
        post.id,
        FoodPostStatus.PICKED_UP,
        FoodPostStatus.DELIVERED,
        receiverId,
        manager,
      );

      await this.notifications.create(
        post.donorId,
        `Your food donation "${post.title}" has been delivered successfully.`,
        manager,
      );

      if (post.acceptedById) {
        await this.notifications.create(
          post.acceptedById,
          `The receiver has confirmed delivery of "${post.title}".`,
          manager,
        );
      }

      return updatedPost;
    });
  }
}
