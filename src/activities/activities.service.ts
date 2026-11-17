import { Injectable } from '@nestjs/common';
import type { ActivityDto, LeadIdPayload } from '@crm/shared';
import { toActivityDto } from '../leads/leads.mapper';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ActivityEntity } from './activity.entity';

@Injectable()
export class ActivitiesService {
  constructor(
    @InjectRepository(ActivityEntity)
    private readonly repo: Repository<ActivityEntity>,
  ) {}

  async findByLead({ leadId }: LeadIdPayload): Promise<ActivityDto[]> {
    const activities = await this.repo.find({
      where: { leadId },
    });
    return activities.map(toActivityDto);
  }
}
