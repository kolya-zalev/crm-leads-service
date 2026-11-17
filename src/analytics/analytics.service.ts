import { Injectable } from '@nestjs/common';
import {
  closeStatuses,
  openStatuses,
  type AnalyticsEmployeesPayload,
  type AnalyticsLeadsPayload,
  type ClosedByUserRow,
  type EmployeeAnalytics,
  type LeadAnalytics,
  type LeadByUserRow,
  type UserRef,
} from '@crm/shared';
import { InjectRepository } from '@nestjs/typeorm';
import {
  And,
  In,
  IsNull,
  LessThan,
  MoreThanOrEqual,
  Repository,
} from 'typeorm';
import {
  dayMs,
  smallSampleThreshold,
  stuckLeadsLimit,
  stuckThresholdDays,
} from './analytics.constants';
import { buildEmployeeAnalytics } from './employee/employee-analytics';
import { LeadEntity } from '../leads/lead.entity';

@Injectable()
export class AnalyticsService {
  constructor(
    @InjectRepository(LeadEntity)
    private readonly leads: Repository<LeadEntity>,
  ) {}

  async getLeadAnalytics({
    users,
  }: AnalyticsLeadsPayload): Promise<LeadAnalytics> {
    const threshold = new Date(Date.now() - stuckThresholdDays * dayMs);

    const stuckWhere = {
      status: In([...openStatuses]),
      statusChangedAt: LessThan(threshold),
    };

    const allByStatusRaw = await this.leads
      .createQueryBuilder('lead')
      .select('lead.status', 'status')
      .addSelect('COUNT(*)', 'count')
      .groupBy('lead.status')
      .getRawMany<{ status: string; count: string }>();

    const allByStatus = allByStatusRaw.map((row) => ({
      status: row.status,
      count: Number(row.count),
    }));

    const won = allByStatus.find((s) => s.status === 'won')?.count ?? 0;
    const lost = allByStatus.find((s) => s.status === 'lost')?.count ?? 0;
    const closed = won + lost;

    let open = 0;
    for (const status of openStatuses) {
      const found = allByStatus.find((s) => s.status === status);
      open += found?.count ?? 0;
    }

    const winRate = closed === 0 ? 0 : Math.round((won / closed) * 100);

    const stuckByStatusRaw = await this.leads
      .createQueryBuilder('lead')
      .select('lead.status', 'status')
      .addSelect('COUNT(*)', 'count')
      .where('lead.status IN (:...statuses)', { statuses: [...openStatuses] })
      .andWhere('lead.statusChangedAt < :threshold', { threshold })
      .groupBy('lead.status')
      .getRawMany<{ status: string; count: string }>();

    const stuckByStatus = stuckByStatusRaw.map((row) => ({
      status: row.status,
      count: Number(row.count),
    }));

    const stuckNew = stuckByStatus.find((s) => s.status === 'new')?.count ?? 0;
    const stuckContacted =
      stuckByStatus.find((s) => s.status === 'contacted')?.count ?? 0;
    const stuckQualified =
      stuckByStatus.find((s) => s.status === 'qualified')?.count ?? 0;

    const stuckLeadsRaw = await this.leads.find({
      where: stuckWhere,
      order: { statusChangedAt: 'ASC' },
      take: stuckLeadsLimit,
      select: {
        id: true,
        name: true,
        company: true,
        status: true,
        statusChangedAt: true,
      },
    });

    const stuckLeads = stuckLeadsRaw.map((lead) => {
      const daysStuck = Math.floor(
        (Date.now() - lead.statusChangedAt.getTime()) / dayMs,
      );
      return {
        id: lead.id,
        name: lead.name,
        company: lead.company,
        status: lead.status,
        daysStuck,
      };
    });

    const closedBeforeTracking = await this.leads.count({
      where: {
        status: In([...closeStatuses]),
        closedById: IsNull(),
      },
    });

    const closedGroupsRaw = await this.leads
      .createQueryBuilder('lead')
      .select('lead.closedById', 'closedById')
      .addSelect('lead.status', 'status')
      .addSelect('COUNT(*)', 'count')
      .where('lead.closedById IS NOT NULL')
      .groupBy('lead.closedById')
      .addGroupBy('lead.status')
      .getRawMany<{
        closedById: string | null;
        status: string;
        count: string;
      }>();

    const closedGroups = closedGroupsRaw.map((row) => ({
      closedById: row.closedById,
      status: row.status,
      count: Number(row.count),
    }));

    const unassignedWhere = {
      status: In([...openStatuses]),
      assignedToId: IsNull(),
    };

    const countUnassigned = await this.leads.count({
      where: unassignedWhere,
    });

    const unassignedRaw = await this.leads.find({
      where: unassignedWhere,
      order: { statusChangedAt: 'ASC' },
      take: stuckLeadsLimit,
      select: {
        id: true,
        name: true,
        company: true,
        status: true,
      },
    });

    const closedBy = this.buildClosedBy(closedGroups, users);

    const leadsByUser = await this.buildLeadsByUser(users);

    return {
      totals: { open, won, lost, closed, winRate },
      unassigned: {
        total: countUnassigned,
        leads: unassignedRaw,
      },
      stuck: {
        thresholdDays: stuckThresholdDays,
        byStatus: {
          new: stuckNew,
          contacted: stuckContacted,
          qualified: stuckQualified,
        },
        leads: stuckLeads,
      },
      closedBy,
      closedBeforeTracking,
      leadsByUser,
    };
  }

  async getEmployeeAnalytics({
    from: fromIso,
    to: toIso,
    users,
  }: AnalyticsEmployeesPayload): Promise<EmployeeAnalytics> {
    const from = new Date(fromIso);
    const to = new Date(toIso);
    const now = new Date();

    const [openLeads, createdLeads, closedLeadsRaw] = await Promise.all([
      this.leads.find({
        where: { status: In([...openStatuses]) },
        select: { assignedToId: true, status: true, statusChangedAt: true },
      }),
      this.leads.find({
        where: { createdAt: And(MoreThanOrEqual(from), LessThan(to)) },
        select: { assignedToId: true },
      }),
      this.leads.find({
        where: {
          status: In([...closeStatuses]),
          closedAt: And(MoreThanOrEqual(from), LessThan(to)),
        },
        select: {
          closedById: true,
          status: true,
          closedAt: true,
          createdAt: true,
        },
      }),
    ]);

    const closedLeads = closedLeadsRaw.flatMap((lead) =>
      lead.closedAt === null ? [] : [{ ...lead, closedAt: lead.closedAt }],
    );

    const built = buildEmployeeAnalytics({
      users,
      openLeads,
      createdLeads,
      closedLeads,
      now,
      overdueThresholdDays: stuckThresholdDays,
    });

    return {
      period: { from: from.toISOString(), to: to.toISOString() },
      overdueThresholdDays: stuckThresholdDays,
      smallSampleThreshold,
      ...built,
    };
  }

  private async buildLeadsByUser(users: UserRef[]): Promise<LeadByUserRow[]> {
    const groupsRaw = await this.leads
      .createQueryBuilder('lead')
      .select('lead.assignedToId', 'assignedToId')
      .addSelect('COUNT(*)', 'count')
      .groupBy('lead.assignedToId')
      .getRawMany<{ assignedToId: string | null; count: string }>();

    const rows: LeadByUserRow[] = groupsRaw.map((group) => {
      const leadCount = Number(group.count);

      if (!group.assignedToId) {
        return {
          userId: null,
          userName: 'Unassigned',
          leadCount,
        };
      }

      const user = users.find((item) => item.id === group.assignedToId);
      return {
        userId: group.assignedToId,
        userName: user?.name ?? 'Unknown',
        leadCount,
      };
    });

    rows.sort((a, b) => b.leadCount - a.leadCount);
    return rows;
  }

  private buildClosedBy(
    groups: {
      closedById: string | null;
      status: string;
      count: number;
    }[],
    users: UserRef[],
  ): ClosedByUserRow[] {
    const statsByUser = new Map<string, { won: number; lost: number }>();

    for (const group of groups) {
      if (!group.closedById) continue;

      if (!statsByUser.has(group.closedById)) {
        statsByUser.set(group.closedById, { won: 0, lost: 0 });
      }

      const stats = statsByUser.get(group.closedById)!;
      if (group.status === 'won') stats.won += group.count;
      if (group.status === 'lost') stats.lost += group.count;
    }

    if (statsByUser.size === 0) return [];

    const result: ClosedByUserRow[] = [];
    for (const [userId, stats] of statsByUser) {
      const user = users.find((u) => u.id === userId);
      result.push({
        userId,
        userName: user?.name ?? 'Unknown',
        won: stats.won,
        lost: stats.lost,
        total: stats.won + stats.lost,
      });
    }

    result.sort((a, b) => b.total - a.total);

    return result;
  }
}
