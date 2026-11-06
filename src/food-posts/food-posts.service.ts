import {
  BadRequestException, ConflictException, ForbiddenException,
  Injectable, NotFoundException,
} from '@nestjs/common';
import { DataSource } from 'typeorm';
import { User, UserRole } from '../users/entities/user.entity.js'; // path adjust
import { NotificationsService } from '../notifications/notifications.service.js';
import { StatusHistoryService } from '../status-history/status-history.service.js';
import { UploadsService } from '../uploads/uploads.service.js';
import { CreateFoodPostDto } from './dto/create-food-post.dto.js';
import { DonorHistoryQueryDto } from './dto/donor-history-query.dto.js';
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
    if (post.donorId !== donorId) throw new ForbiddenException('You can only manage your own posts');
    return post;
  }
 
  async create(user: AuthUser, dto: CreateFoodPostDto, file?: Express.Multer.File) {
    const donor = await this.dataSource.getRepository(User).findOneBy({ id: user.id });
    if (!donor || !donor.isVerified) {
      throw new ForbiddenException('Your account must be verified by admin before posting');
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
        await this.statusHistory.log(post.id, null, FoodPostStatus.POSTED, user.id, manager);
        return post;
      });
    } catch (e) {
      if (photo) await this.uploads.delete(photo.publicId); // DB fail hole photo muche felo
      throw e;
    }
  }
 
  async findMine(donorId: number, q: DonorHistoryQueryDto) {
    const qb = this.repo
      .createQueryBuilder('p')
      .where('p.donorId = :donorId', { donorId })
      .orderBy('p.createdAt', 'DESC')
      .skip((q.page - 1) * q.limit)
      .take(q.limit);
 
    if (q.status) qb.andWhere('p.status = :status', { status: q.status });
    if (q.from) qb.andWhere('p.createdAt >= :from', { from: q.from });
    if (q.to) qb.andWhere('p.createdAt <= :to', { to: q.to });
 
    const [data, total] = await qb.getManyAndCount();
    return {
      data,
      meta: { page: q.page, limit: q.limit, total, totalPages: Math.ceil(total / q.limit) },
    };
  }
 
  async findOne(id: number, user: AuthUser) {
    const post = await this.repo.findOneBy({ id });
    if (!post) throw new NotFoundException('Food post not found');
 
    // Privacy: exact address shudhu donor, accept kora volunteer ar admin dekhbe
    const canSeeExact =
      user.role === UserRole.ADMIN || post.donorId === user.id || post.acceptedById === user.id;
    if (canSeeExact) return post;
 
    return {
      ...post,
      address: null,
      latitude: Math.round(post.latitude * 100) / 100,
      longitude: Math.round(post.longitude * 100) / 100,
    };
  }
 
  async update(id: number, user: AuthUser, dto: UpdateFoodPostDto, file?: Express.Multer.File) {
    const post = await this.getOwnedOrThrow(id, user.id);
    if (post.status !== FoodPostStatus.POSTED) {
      throw new BadRequestException('Only posts with status POSTED can be edited');
    }
 
    const { photo: _ignore, ...fields } = dto as any;
    const patch: Record<string, unknown> = { ...fields };
    if (dto.pickupDeadline) patch.pickupDeadline = this.assertFuture(dto.pickupDeadline);
 
    const newPhoto = file ? await this.uploads.uploadImage(file) : null;
    if (newPhoto) {
      patch.photoUrl = newPhoto.url;
      patch.photoPublicId = newPhoto.publicId;
    }
 
    const res = await this.repo.update({ id, donorId: user.id, status: FoodPostStatus.POSTED }, patch as any);
    if (!res.affected) {
      if (newPhoto) await this.uploads.delete(newPhoto.publicId);
      throw new ConflictException('Post status changed, it can no longer be edited');
    }
    if (newPhoto && post.photoPublicId) await this.uploads.delete(post.photoPublicId);
 
    return this.repo.findOneBy({ id });
  }
 
  async cancel(id: number, user: AuthUser) {
    await this.getOwnedOrThrow(id, user.id);
 
    return this.dataSource.transaction(async (manager) => {
      const res = await manager
        .getRepository(FoodPost)
        .update({ id, donorId: user.id, status: FoodPostStatus.POSTED }, { status: FoodPostStatus.CANCELLED });
      if (!res.affected) {
        throw new ConflictException('Only posts with status POSTED can be cancelled');
      }
      await this.statusHistory.log(id, FoodPostStatus.POSTED, FoodPostStatus.CANCELLED, user.id, manager);
      return { message: 'Post cancelled' };
    });
  }
}
