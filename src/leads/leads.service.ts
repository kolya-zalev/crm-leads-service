import {
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import {
  isClosedStatus,
  permissions,
  type CreateLeadPayload,
  type FindLeadPayload,
  type LeadChanges,
  type LeadDto,
  type OkResponse,
  type Permission,
  type RemoveLeadPayload,
  type UpdateLeadPayload,
  type UpdateLeadResponse,
} from '@crm/shared';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { toLeadDto } from './leads.mapper';
import { LeadEntity } from './lead.entity';

@Injectable()
export class LeadsService {
  constructor(
    @InjectRepository(LeadEntity)
    private readonly repo: Repository<LeadEntity>,
  ) {}

  async findAll(): Promise<LeadDto[]> {
    const leads = await this.repo.find({
      order: { createdAt: 'DESC' },
    });
    return leads.map(toLeadDto);
  }

  async findOne({ id }: FindLeadPayload): Promise<LeadDto> {
    const lead = await this.repo.findOneBy({ id });
    if (!lead) throw new NotFoundException(`Lead ${id} not found`);
    return toLeadDto(lead);
  }

  async create({ data }: CreateLeadPayload): Promise<LeadDto> {
    const lead = await this.repo.save(this.repo.create(data));
    return toLeadDto(lead);
  }

  async update({
    actor,
    id,
    data,
    assignee,
  }: UpdateLeadPayload): Promise<UpdateLeadResponse> {
    const { assignedToId, ...rest } = data;
    const oldLead = await this.repo.findOneBy({ id });
    if (!oldLead) throw new NotFoundException(`Lead ${id} not found`);

    const has = (permission: Permission) =>
      actor.permissions.includes(permission);

    if (!has(permissions.leadUpdate)) {
      const changesOtherFields = Object.entries(rest).some(
        ([key, value]) => key !== 'status' && value !== undefined,
      );
      if (changesOtherFields) {
        throw new ForbiddenException('You cannot change this lead');
      }
      if (rest.status === undefined && assignedToId === undefined) {
        throw new ForbiddenException('You cannot change this lead');
      }
    }

    const assignInPayload = assignedToId !== undefined;

    if (assignInPayload) {
      if (assignedToId === null) {
        if (!has(permissions.leadUnassign)) {
          throw new ForbiddenException('Insufficient permissions');
        }
      } else if (assignedToId === actor.id) {
        const leadIsFreeOrMine =
          oldLead.assignedToId === null || oldLead.assignedToId === actor.id;
        const canTake = has(permissions.leadTake) && leadIsFreeOrMine;
        if (!has(permissions.leadAssign) && !canTake) {
          throw new ForbiddenException('You cannot change this lead');
        }
      } else if (!has(permissions.leadAssign)) {
        throw new ForbiddenException('You cannot change this lead');
      }
    }

    if (assignInPayload && assignedToId === null) assignee = null;

    const assignedChanged =
      assignInPayload && assignedToId !== (oldLead.assignedToId ?? null);

    const statusChanged = !!rest.status && rest.status !== oldLead.status;

    const previousStatus = oldLead.status;
    const previousAssigneeName = oldLead.assignedToName ?? null;

    const closing = statusChanged && isClosedStatus(rest.status!);
    const statusFields = statusChanged
      ? {
          statusChangedAt: new Date(),
          closedAt: closing ? new Date() : null,
          closedById: closing ? actor.id : null,
        }
      : {};

    const updatedLead = await this.repo.save(
      this.repo.merge(oldLead, {
        ...rest,
        ...statusFields,
        ...(assignedChanged
          ? {
              assignedToId: assignedToId ?? null,
              assignedToName: assignee?.name ?? null,
            }
          : {}),
      }),
    );

    return {
      lead: toLeadDto(updatedLead),
      changes: {
        assignedChanged,
        nextAssignee: assignee,
        previousAssigneeName,
        statusChanged,
        closing,
        newStatus: rest.status,
        previousStatus,
      } satisfies LeadChanges,
    };
  }

  async remove({ id }: RemoveLeadPayload): Promise<OkResponse> {
    const result = await this.repo.findOneBy({ id });
    if (!result) throw new NotFoundException(`Lead ${id} not found`);
    await this.repo.delete({ id });
    return { ok: true };
  }
}