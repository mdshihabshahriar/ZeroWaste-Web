
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
}
