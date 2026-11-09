import { Injectable, NotFoundException } from '@nestjs/common';

import { InjectRepository } from '@nestjs/typeorm';

import { EntityManager, Repository } from 'typeorm';

import { Notification } from './entities/notification.entity.js';
 
@Injectable()

export class NotificationsService {

  constructor(

    @InjectRepository(Notification)

    private readonly repo: Repository<Notification>,

  ) {}
 

  create(userId: number, message: string, manager?: EntityManager) {

    const repo = manager ? manager.getRepository(Notification) : this.repo;

    return repo.save(repo.create({ userId, message }));

  }
 
  async findMine(userId: number, page = 1, limit = 20) {

    const [data, total] = await this.repo.findAndCount({

      where: { userId },

      order: { createdAt: 'DESC' },

      skip: (page - 1) * limit,

      take: limit,

    });

    return { data, meta: { page, limit, total, totalPages: Math.ceil(total / limit) } };

  }
 
  async markRead(id: number, userId: number) {


    const res = await this.repo.update({ id, userId }, { isRead: true });

    if (!res.affected) throw new NotFoundException('Notification not found');

    return { message: 'Marked as read' };

  }

}
 