import { BadRequestException, ConflictException, ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';

import { InjectRepository } from '@nestjs/typeorm';

import { Repository } from 'typeorm';

import { FoodPost, FoodPostStatus } from '../food-posts/entities/food-posts.entity.js';

import { NotificationsService } from '../notifications/notifications.service.js';

import { CreateRatingDto } from './dto/create-rating.dto.js';

import { Rating } from './entities/rating.entity.js';
 
@Injectable()

export class RatingsService {

  constructor(

    @InjectRepository(Rating) private readonly ratings: Repository<Rating>,

    @InjectRepository(FoodPost) private readonly posts: Repository<FoodPost>,

    private readonly notifications: NotificationsService,

  ) {}
 
  async create(raterId: number, dto: CreateRatingDto) {

    const post = await this.posts.findOneBy({ id: dto.postId });

    if (!post) throw new NotFoundException('Food post not found');

    if (post.status !== FoodPostStatus.DELIVERED) {

      throw new BadRequestException('You can rate only after the post is DELIVERED');

    }
 

    let ratedId: number | null;

    if (raterId === post.donorId) ratedId = post.acceptedById;

    else if (raterId === post.acceptedById) ratedId = post.donorId;

    else throw new ForbiddenException('You were not part of this donation');

    if (!ratedId) throw new BadRequestException('No one to rate for this post');
 
    try {

      const rating = await this.ratings.save(

        this.ratings.create({ postId: post.id, raterId, ratedId, score: dto.score, comment: dto.comment ?? null }),

      );

      await this.notifications.create(ratedId, `You received a ${dto.score}-star rating for donation #${post.id}.`);

      return rating;

    } catch (e: any) {

      if (e?.code === '23505') throw new ConflictException('You have already rated this donation');

      throw e;

    }

  }

}
 