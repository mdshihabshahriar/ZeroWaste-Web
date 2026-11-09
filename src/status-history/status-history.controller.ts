import { Controller, ForbiddenException, Get, NotFoundException, Param, ParseIntPipe } from '@nestjs/common';

import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';

import { InjectRepository } from '@nestjs/typeorm';

import { Repository } from 'typeorm';

import { CurrentUser } from '../common/decorators/current-user.decorator.js';

import { UserRole } from '../users/entities/user.entity.js';

import { FoodPost } from '../food-posts/entities/food-posts.entity.js';

import { StatusHistoryService } from './status-history.service.js';
 
@ApiTags('status-history')

@ApiBearerAuth()

@Controller('food-posts/:postId/history')

export class StatusHistoryController {

  constructor(

    private readonly service: StatusHistoryService,

    @InjectRepository(FoodPost) private readonly posts: Repository<FoodPost>,

  ) {}
 
  @Get()

  async history(

    @Param('postId', ParseIntPipe) postId: number,

    @CurrentUser() user: { id: number; role: UserRole },

  ) {

    const post = await this.posts.findOneBy({ id: postId });

    if (!post) throw new NotFoundException('Food post not found');

    const allowed =

      user.role === UserRole.ADMIN || post.donorId === user.id || post.acceptedById === user.id;

    if (!allowed) throw new ForbiddenException();

    return this.service.findByPost(postId);

  }

}
 