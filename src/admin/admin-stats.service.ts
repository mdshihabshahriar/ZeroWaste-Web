import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { In, Repository } from 'typeorm';
import { FoodPost, FoodPostStatus } from '../food-posts/entities/food-posts.entity.js';
import { Report, ReportStatus } from '../reports/entities/report.entity.js';
import { User, UserRole } from '../users/entities/user.entity.js';

type Row<T extends string> = { grp: T; count: string };

function fill<T extends string>(keys: T[], rows: Row<T>[]) {
  const out = Object.fromEntries(keys.map((k) => [k, 0])) as Record<T, number>;
  for (const r of rows) out[r.grp] = Number(r.count);
  return out;
}

@Injectable()
export class AdminStatsService {
  constructor(
    @InjectRepository(User) private users: Repository<User>,
    @InjectRepository(FoodPost) private posts: Repository<FoodPost>,
    @InjectRepository(Report) private reports: Repository<Report>,
  ) {}

  async overview() {
    const [roleRows, statusRows, unverified, banned, meals, volunteers, openReports] =
      await Promise.all([
        this.users.createQueryBuilder('u')
          .select('u.role', 'grp').addSelect('COUNT(*)', 'count')
          .groupBy('u.role').getRawMany<Row<UserRole>>(),

        this.posts.createQueryBuilder('p')
          .select('p.status', 'grp').addSelect('COUNT(*)', 'count')
          .groupBy('p.status').getRawMany<Row<FoodPostStatus>>(),

        this.users.count({
          where: { role: In([UserRole.DONOR, UserRole.RECEIVER]), isVerified: false, isActive: true },
        }),

        this.users.count({ where: { isActive: false } }),

        // meals saved = delivered post gulor portions er jogfol
        this.posts.createQueryBuilder('p')
          .select('COALESCE(SUM(p.portions), 0)', 'total')
          .where('p.status = :s', { s: FoodPostStatus.DELIVERED })
          .getRawOne<{ total: string }>(),

        // active volunteer = jara kono post accept/pickup/deliver korechhe
        this.posts.createQueryBuilder('p')
          .select('COUNT(DISTINCT p.acceptedById)', 'count')
          .where('p.status IN (:...s)', {
            s: [FoodPostStatus.ACCEPTED, FoodPostStatus.PICKED_UP, FoodPostStatus.DELIVERED],
          })
          .getRawOne<{ count: string }>(),

        this.reports.count({ where: { status: ReportStatus.OPEN } }),
      ]);

    const byRole = fill(Object.values(UserRole), roleRows);
    const byStatus = fill(Object.values(FoodPostStatus), statusRows);

    return {
      users: {
        total: Object.values(byRole).reduce((a, b) => a + b, 0),
        byRole,
        pendingVerification: unverified,
        banned,
      },
      posts: {
        total: Object.values(byStatus).reduce((a, b) => a + b, 0),
        byStatus,
      },
      mealsSaved: Number(meals?.total ?? 0),
      activeVolunteers: Number(volunteers?.count ?? 0),
      openReports,
    };
  }
}