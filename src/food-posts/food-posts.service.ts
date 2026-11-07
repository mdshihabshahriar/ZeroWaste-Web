
import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { DataSource } from 'typeorm';
import { User, UserRole } from '../users/entities/user.entity.js';
import { NotificationsService } from '../notifications/notifications.service.js';
import { StatusHistoryService } from '../status-history/status-history.service.js';
import { UploadsService } from '../uploads/uploads.service.js';
import { CreateFoodPostDto } from './dto/create-food-post.dto.js';
import { DonorHistoryQueryDto } from './dto/donor-history-query.dto.js';
import { NearbyFoodPostsQueryDto } from './dto/nearby-food-posts-query.dto.js';
import { UpdateFoodPostDto } from './dto/update-food-post.dto.js';
import { FoodPost, FoodPostStatus } from './entities/food-posts.entity.js';

type AuthUser = { id: number; role: UserRole };

@Injectable()
export class FoodPostsService {
  constructor(
    private readonly dataSource: DataSource,
    private readonly statusHistory: StatusHistoryService,
    private readonly notifications: NotificationsService,
    private readonly uploads: UploadsService,
  ) {}

  private get repo() {
    return this.dataSource.getRepository(FoodPost);
  }

  private assertFuture(iso: string) {
    const d = new Date(iso);
    if (d.getTime() <= Date.now()) {
      throw new BadRequestException('pickupDeadline must be in the future');
    }
    return d;
  }

  private async getOwnedOrThrow(id: number, donorId: number) {
    const post = await this.repo.findOneBy({ id });
    if (!post) throw new NotFoundException('Food post not found');
    if (post.donorId !== donorId) {
      throw new ForbiddenException('You can only manage your own posts');
    }
    return post;
  }

  async create(user: AuthUser, dto: CreateFoodPostDto, file?: Express.Multer.File) {
    const donor = await this.dataSource
      .getRepository(User)
      .findOneBy({ id: user.id });

    if (!donor || !donor.isVerified) {
      throw new ForbiddenException(
        'Your account must be verified by admin before posting',
      );
    }

    const deadline = this.assertFuture(dto.pickupDeadline);
    const photo = file ? await this.uploads.uploadImage(file) : null;

    try {
      return await this.dataSource.transaction(async (manager) => {
        const repo = manager.getRepository(FoodPost);

        const post = await repo.save(
          repo.create({
            title: dto.title,
            description: dto.description ?? null,
            foodType: dto.foodType,
            portions: dto.portions,
            address: dto.address,
            latitude: dto.latitude,
            longitude: dto.longitude,
            pickupDeadline: deadline,
            donorId: user.id,
            photoUrl: photo?.url ?? null,
            photoPublicId: photo?.publicId ?? null,
          }),
        );

        await this.statusHistory.log(
          post.id,
          null,
          FoodPostStatus.POSTED,
          user.id,
          manager,
        );

        return post;
      });
    } catch (e) {
      if (photo) await this.uploads.delete(photo.publicId);
      throw e;
    }
  }

  // Find available food donations near a volunteer
  async findNearby(q: NearbyFoodPostsQueryDto) {
    const distanceSql = `
      (
        6371 * ACOS(
          LEAST(1, GREATEST(-1,
            COS(RADIANS(:latitude))
            * COS(RADIANS(p.latitude))
            * COS(RADIANS(p.longitude) - RADIANS(:longitude))
            + SIN(RADIANS(:latitude))
            * SIN(RADIANS(p.latitude))
          ))
        )
      )
    `;

    const query = this.repo
      .createQueryBuilder('p')
      .select('p.id', 'id')
      .addSelect('p.title', 'title')
      .addSelect('p.description', 'description')
      .addSelect('p.foodType', 'foodType')
      .addSelect('p.portions', 'portions')
      .addSelect('p.photoUrl', 'photoUrl')
      .addSelect('p.pickupDeadline', 'pickupDeadline')
      .addSelect('p.status', 'status')
      .addSelect(distanceSql, 'distanceKm')
      .where('p.status = :status', {
        status: FoodPostStatus.POSTED,
      })
      .andWhere('p.pickupDeadline > CURRENT_TIMESTAMP')
      .andWhere(`${distanceSql} <= :radiusKm`)
      .setParameters({
        latitude: q.latitude,
        longitude: q.longitude,
        radiusKm: q.radiusKm,
      });

    const total = await query.clone().getCount();

    const rows = await query
      .clone()
      .orderBy(distanceSql, 'ASC')
      .skip((q.page - 1) * q.limit)
      .take(q.limit)
      .getRawMany();

    const data = rows.map((row) => ({
      ...row,
      distanceKm: Number(Number(row.distanceKm).toFixed(2)),
    }));

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

  
  // Atomically accept a food post using a PostgreSQL row lock
  async acceptFoodPost(id: number, user: AuthUser) {
    return this.dataSource.transaction(async (manager) => {
      const repo = manager.getRepository(FoodPost);

      const post = await repo.findOne({
        where: { id },
        lock: { mode: 'pessimistic_write' },
      });

      if (!post) {
        throw new NotFoundException('Food post not found');
      }

      if (post.status !== FoodPostStatus.POSTED) {
        throw new ConflictException(
          'This food post is already accepted or unavailable',
        );
      }

      if (post.pickupDeadline <= new Date()) {
        throw new ConflictException(
          'The pickup deadline has passed',
        );
      }

      post.status = FoodPostStatus.ACCEPTED;
      post.acceptedById = user.id;

      const updatedPost = await repo.save(post);

      await this.statusHistory.log(
        post.id,
        FoodPostStatus.POSTED,
        FoodPostStatus.ACCEPTED,
        user.id,
        manager,
      );

      await this.notifications.create(
        post.donorId,
        `Your food donation "${post.title}" has been accepted.`,
        manager,
      );

      return updatedPost;
    });
  }

    // Mark an accepted food post as picked up by its assigned volunteer
  async markAsPickedUp(id: number, user: AuthUser) {
    return this.dataSource.transaction(async (manager) => {
      const repo = manager.getRepository(FoodPost);

      const post = await repo.findOne({
        where: { id },
        lock: { mode: 'pessimistic_write' },
      });

      if (!post) {
        throw new NotFoundException('Food post not found');
      }

      if (post.acceptedById !== user.id) {
        throw new ForbiddenException(
          'Only the volunteer who accepted this food post can pick it up',
        );
      }

      if (post.status !== FoodPostStatus.ACCEPTED) {
        throw new ConflictException(
          'Only accepted food posts can be marked as picked up',
        );
      }

      post.status = FoodPostStatus.PICKED_UP;

      const updatedPost = await repo.save(post);

      await this.statusHistory.log(
        post.id,
        FoodPostStatus.ACCEPTED,
        FoodPostStatus.PICKED_UP,
        user.id,
        manager,
      );

      await this.notifications.create(
        post.donorId,
        `Your food donation "${post.title}" has been picked up.`,
        manager,
      );

      return updatedPost;
    });
  }

  async findMine(donorId: number, q: DonorHistoryQueryDto) {
    const qb = this.repo
      .createQueryBuilder('p')
      .where('p.donorId = :donorId', { donorId })
      .orderBy('p.createdAt', 'DESC')
      .skip((q.page - 1) * q.limit)
      .take(q.limit);

    if (q.status) {
      qb.andWhere('p.status = :status', { status: q.status });
    }

    if (q.from) {
      qb.andWhere('p.createdAt >= :from', { from: q.from });
    }

    if (q.to) {
      qb.andWhere('p.createdAt <= :to', { to: q.to });
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

  async findOne(id: number, user: AuthUser) {
    const post = await this.repo.findOneBy({ id });
    if (!post) throw new NotFoundException('Food post not found');

    const canSeeExact =
      user.role === UserRole.ADMIN ||
      post.donorId === user.id ||
      post.acceptedById === user.id;

    if (canSeeExact) return post;

    return {
      ...post,
      address: null,
      latitude: Math.round(post.latitude * 100) / 100,
      longitude: Math.round(post.longitude * 100) / 100,
    };
  }

  async update(
    id: number,
    user: AuthUser,
    dto: UpdateFoodPostDto,
    file?: Express.Multer.File,
  ) {
    const post = await this.getOwnedOrThrow(id, user.id);

    if (post.status !== FoodPostStatus.POSTED) {
      throw new BadRequestException(
        'Only posts with status POSTED can be edited',
      );
    }

    const { photo: _ignore, ...fields } = dto as any;
    const patch: Record<string, unknown> = { ...fields };

    if (dto.pickupDeadline) {
      patch.pickupDeadline = this.assertFuture(dto.pickupDeadline);
    }

    const newPhoto = file ? await this.uploads.uploadImage(file) : null;

    if (newPhoto) {
      patch.photoUrl = newPhoto.url;
      patch.photoPublicId = newPhoto.publicId;
    }

    const res = await this.repo.update(
      { id, donorId: user.id, status: FoodPostStatus.POSTED },
      patch as any,
    );

    if (!res.affected) {
      if (newPhoto) await this.uploads.delete(newPhoto.publicId);
      throw new ConflictException(
        'Post status changed, it can no longer be edited',
      );
    }

    if (newPhoto && post.photoPublicId) {
      await this.uploads.delete(post.photoPublicId);
    }

    return this.repo.findOneBy({ id });
  }

  async cancel(id: number, user: AuthUser) {
    await this.getOwnedOrThrow(id, user.id);

    return this.dataSource.transaction(async (manager) => {
      const res = await manager
        .getRepository(FoodPost)
        .update(
          {
            id,
            donorId: user.id,
            status: FoodPostStatus.POSTED,
          },
          {
            status: FoodPostStatus.CANCELLED,
          },
        );

      if (!res.affected) {
        throw new ConflictException(
          'Only posts with status POSTED can be cancelled',
        );
      }

      await this.statusHistory.log(
        id,
        FoodPostStatus.POSTED,
        FoodPostStatus.CANCELLED,
        user.id,
        manager,
      );

      return { message: 'Post cancelled' };
    });
  }
}
