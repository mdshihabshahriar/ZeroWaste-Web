import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { AuditLog } from './entities/audit-log.entity.js';

@Injectable()
export class AuditLogsService {
  constructor(@InjectRepository(AuditLog) private repo: Repository<AuditLog>) {}

  async log(userId: number | null, action: string, entity?: string, entityId?: number) {
    await this.repo.save(
      this.repo.create({ user: userId ? { id: userId } : undefined, action, entity, entityId }),
    );
  }
}