import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { UpsertReceiverProfileDto } from './dto/upsert-receiver-profile.dto.js';
import { ReceiverProfile } from './entities/receiver-profile.entity.js';

@Injectable()
export class ReceiverProfilesService {
  constructor(@InjectRepository(ReceiverProfile) private repo: Repository<ReceiverProfile>) {}

  private view(p: ReceiverProfile) {
    return {
      id: p.id,
      organisationName: p.organisationName,
      orgType: p.orgType,
      capacity: p.capacity,
    };
  }

  async getMine(userId: number) {
    const p = await this.repo.findOne({ where: { user: { id: userId } } });
    if (!p) throw new NotFoundException('Profile not created yet');
    return this.view(p);
  }

  async upsertMine(userId: number, dto: UpsertReceiverProfileDto) {
    let p = await this.repo.findOne({ where: { user: { id: userId } } });
    if (!p) p = this.repo.create({ user: { id: userId } });

    p.organisationName = dto.organisationName.trim();
    if (dto.orgType !== undefined) p.orgType = dto.orgType;
    if (dto.capacity !== undefined) p.capacity = dto.capacity;

    return this.view(await this.repo.save(p));
  }
}