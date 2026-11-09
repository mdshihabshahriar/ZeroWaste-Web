import {
  BadRequestException, ConflictException, Injectable, NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { QueryFailedError, Repository } from 'typeorm';
import { FoodPost } from '../food-posts/entities/food-posts.entity.js';
import { CreateReportDto } from './dto/create-report.dto.js';
import { Report } from './entities/report.entity.js';

@Injectable()
export class ReportsService {
  constructor(
    @InjectRepository(Report) private reports: Repository<Report>,
    @InjectRepository(FoodPost) private posts: Repository<FoodPost>,
  ) {}

  async create(reporterId: number, dto: CreateReportDto) {
    const post = await this.posts.findOne({ where: { id: dto.postId } });
    if (!post) throw new NotFoundException('Post not found');
    if (post.donorId === reporterId) {
      throw new BadRequestException('You cannot report your own post');
    }

    try {
      const r = await this.reports.save(
        this.reports.create({ postId: dto.postId, reporterId, reason: dto.reason.trim() }),
      );
      return { id: r.id, postId: r.postId, status: r.status, createdAt: r.createdAt };
    } catch (e) {

      if (e instanceof QueryFailedError && (e.driverError as { code?: string })?.code === '23505') {
        throw new ConflictException('You already reported this post');
      }
      throw e;
    }
  }
}