import {
  BadRequestException, ConflictException, ForbiddenException, Injectable, NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { In, Repository } from 'typeorm';
import { AuditLogsService } from '../audit-logs/audit-logs.service.js';
import { PaginationDto } from '../common/dto/pagination.dto.js';
import { paginated } from '../common/helpers/paginate.js';
import { ReceiverProfile } from '../receiver-profiles/entities/receiver-profile.entity.js';
import { User, UserRole } from '../users/entities/user.entity.js';
import { ListUsersDto } from './dto/list-users.dto.js';

@Injectable()
export class AdminUsersService {
  constructor(
    @InjectRepository(User) private users: Repository<User>,
    @InjectRepository(ReceiverProfile) private profiles: Repository<ReceiverProfile>,
    private audit: AuditLogsService,
  ) {}

  async list(q: ListUsersDto) {
    const qb = this.users
      .createQueryBuilder('u')
      .orderBy('u.createdAt', 'DESC')
      .skip(q.skip)
      .take(q.limit);

    if (q.role) qb.andWhere('u.role = :role', { role: q.role });
    if (q.isVerified !== undefined) qb.andWhere('u.isVerified = :v', { v: q.isVerified });
    if (q.isActive !== undefined) qb.andWhere('u.isActive = :a', { a: q.isActive });
    if (q.search) qb.andWhere('(u.name ILIKE :s OR u.email ILIKE :s)', { s: `%${q.search}%` });

    const [rows, total] = await qb.getManyAndCount();
    return paginated(await this.withProfiles(rows), total, q);
  }

  async pending(q: PaginationDto) {
    const qb = this.users
      .createQueryBuilder('u')
      .where('u.role IN (:...roles)', { roles: [UserRole.DONOR, UserRole.RECEIVER] })
      .andWhere('u.isVerified = false')
      .andWhere('u.isActive = true')
      .orderBy('u.createdAt', 'ASC') 
      .skip(q.skip)
      .take(q.limit);

    const [rows, total] = await qb.getManyAndCount();
    return paginated(await this.withProfiles(rows), total, q);
  }

  async verify(adminId: number, id: number) {
    const u = await this.getTarget(id);
    if (u.role !== UserRole.DONOR && u.role !== UserRole.RECEIVER) {
      throw new BadRequestException('Only donor and receiver accounts need verification');
    }
    if (!u.isActive) throw new ConflictException('Account is banned. Unban it first');
    if (u.isVerified) throw new ConflictException('Already verified');

    await this.users.update(id, { isVerified: true });
    await this.audit.log(adminId, 'user.verified', 'users', id);
    return { id, isVerified: true };
  }

  async reject(adminId: number, id: number) {
    const u = await this.getTarget(id);
    if (u.role !== UserRole.DONOR && u.role !== UserRole.RECEIVER) {
      throw new BadRequestException('Only donor and receiver accounts can be rejected');
    }
    if (u.isVerified) throw new ConflictException('Already verified. Use ban instead');
    if (!u.isActive) throw new ConflictException('Account is already inactive');

    await this.users.update(id, { isActive: false, refreshToken: null });
    await this.audit.log(adminId, 'user.rejected', 'users', id);
    return { id, isActive: false };
  }

  async ban(adminId: number, id: number) {
    if (adminId === id) throw new BadRequestException('You cannot ban yourself');
    const u = await this.getTarget(id);
    if (u.role === UserRole.ADMIN) throw new ForbiddenException('An admin cannot be banned');
    if (!u.isActive) throw new ConflictException('Already banned');

    await this.users.update(id, { isActive: false, refreshToken: null });
    await this.audit.log(adminId, 'user.banned', 'users', id);
    return { id, isActive: false };
  }

  async unban(adminId: number, id: number) {
    const u = await this.getTarget(id);
    if (u.isActive) throw new ConflictException('Account is not banned');

    await this.users.update(id, { isActive: true });
    await this.audit.log(adminId, 'user.unbanned', 'users', id);
    return { id, isActive: true };
  }

  private async getTarget(id: number) {
    const u = await this.users.findOne({ where: { id } });
    if (!u) throw new NotFoundException('User not found');
    return u;
  }

  private async withProfiles(rows: User[]) {
    const receiverIds = rows.filter((u) => u.role === UserRole.RECEIVER).map((u) => u.id);
    const map = new Map<number, { organisationName: string; orgType?: string; capacity?: number }>();

    if (receiverIds.length) {
      const ps = await this.profiles.find({
        where: { user: { id: In(receiverIds) } },
        relations: { user: true },
      });
      for (const p of ps) {
        map.set(p.user.id, {
          organisationName: p.organisationName,
          orgType: p.orgType,
          capacity: p.capacity,
        });
      }
    }

    return rows.map((u) => ({
      id: u.id,
      name: u.name,
      email: u.email,
      phone: u.phone,
      role: u.role,
      isVerified: u.isVerified,
      isActive: u.isActive,
      address: u.address,
      createdAt: u.createdAt,
      organisation: u.role === UserRole.RECEIVER ? (map.get(u.id) ?? null) : undefined,
    }));
  }
}