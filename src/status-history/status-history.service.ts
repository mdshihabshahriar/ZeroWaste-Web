import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { EntityManager, Repository } from 'typeorm';
import { StatusHistory } from './entities/status-history.entity.js';
import { FoodPostStatus } from '../food-posts/entities/food-posts.entity.js';
 
@Injectable()
export class StatusHistoryService {
  constructor(
    @InjectRepository(StatusHistory)
    private readonly repo: Repository<StatusHistory>,
  ) {}
 
  // manager dile oi transaction er moddhe save hobe
  async log(
    postId: number,
    fromStatus: FoodPostStatus | null,
    toStatus: FoodPostStatus,
    changedById: number | null,
    manager?: EntityManager,
  ) {
    const repo = manager ? manager.getRepository(StatusHistory) : this.repo;
    return repo.save(repo.create({ postId, fromStatus, toStatus, changedById }));
  }
 
  findByPost(postId: number) {
    return this.repo.find({ where: { postId }, order: { changedAt: 'ASC' } });
  }
}