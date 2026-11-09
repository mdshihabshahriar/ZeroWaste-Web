import { ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DataSource, Repository } from 'typeorm';
import { AuditLogsService } from '../audit-logs/audit-logs.service.js';
import { paginated } from '../common/helpers/paginate.js';
import { FoodPost, FoodPostStatus } from '../food-posts/entities/food-posts.entity.js';
import { Report, ReportStatus } from '../reports/entities/report.entity.js';
import { HandleReportDto } from './dto/handle-report.dto.js';
import { ListPostsDto } from './dto/list-posts.dto.js';
import { ListReportsDto } from './dto/list-reports.dto.js';
import { RemovePostDto } from './dto/remove-post.dto.js';


const REMOVABLE = [FoodPostStatus.POSTED, FoodPostStatus.ACCEPTED, FoodPostStatus.PICKED_UP];

@Injectable()
export class AdminModerationService {
  constructor(
    @InjectRepository(Report) private reports: Repository<Report>,
    @InjectRepository(FoodPost) private posts: Repository<FoodPost>,
    private dataSource: DataSource,
    private audit: AuditLogsService,
  ) {}

  async listReports(q: ListReportsDto) {
    const [rows, total] = await this.reports.findAndCount({
      where: q.status ? { status: q.status } : {},
      relations: { post: true, reporter: true },
      order: { createdAt: 'DESC' },
      skip: q.skip,
      take: q.limit,
    });

    const data = rows.map((r) => ({
      id: r.id,
      reason: r.reason,
      status: r.status,
      createdAt: r.createdAt,
      handledAt: r.handledAt,
      resolutionNote: r.resolutionNote,
      post: r.post
        ? { id: r.post.id, title: r.post.title, status: r.post.status, donorId: r.post.donorId }
        : null,
      reporter: r.reporter ? { id: r.reporter.id, name: r.reporter.name } : null,
    }));
    return paginated(data, total, q);
  }

  async handleReport(adminId: number, id: number, dto: HandleReportDto) {
    const report = await this.reports.findOne({ where: { id } });
    if (!report) throw new NotFoundException('Report not found');
    if (report.status !== ReportStatus.OPEN) {
      throw new ConflictException('This report is already handled');
    }

    report.status = dto.status;
    report.handledById = adminId;
    report.handledAt = new Date();
    report.resolutionNote = dto.note ?? null;
    await this.reports.save(report);

    await this.audit.log(adminId, `report.${dto.status.toLowerCase()}`, 'reports', id);
    return { id, status: report.status };
  }

  async listPosts(q: ListPostsDto) {
    const [rows, total] = await this.posts.findAndCount({
      where: q.status ? { status: q.status } : {},
      relations: { donor: true },
      order: { createdAt: 'DESC' },
      skip: q.skip,
      take: q.limit,
    });

    const data = rows.map((p) => ({
      id: p.id,
      title: p.title,
      status: p.status,
      portions: p.portions,
      address: p.address,
      pickupDeadline: p.pickupDeadline,
      removeReason: p.removeReason,
      createdAt: p.createdAt,
      donor: p.donor ? { id: p.donor.id, name: p.donor.name } : null,
    }));
    return paginated(data, total, q);
  }

  async removePost(adminId: number, postId: number, dto: RemovePostDto) {
    await this.dataSource.transaction(async (em) => {
     
      const post = await em.findOne(FoodPost, {
        where: { id: postId },
        lock: { mode: 'pessimistic_write' },
      });
      if (!post) throw new NotFoundException('Post not found');
      if (!REMOVABLE.includes(post.status)) {
        throw new ConflictException(`A ${post.status} post cannot be removed`);
      }

      await em.update(FoodPost, postId, {
        status: FoodPostStatus.REMOVED,
        removeReason: dto.reason.trim(),
      });

      // oi post er open report gulo auto resolve
      await em.update(
        Report,
        { postId, status: ReportStatus.OPEN },
        {
          status: ReportStatus.RESOLVED,
          handledById: adminId,
          handledAt: new Date(),
          resolutionNote: 'Post removed by admin',
        },
      );
    });

    await this.audit.log(adminId, 'post.removed', 'food_posts', postId);
    return { id: postId, status: FoodPostStatus.REMOVED };
  }
}