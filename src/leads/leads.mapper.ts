import type { ActivityDto, LeadDto, NoteDto, TaskDto } from '@crm/shared';
import type {
  Activity as ActivityRow,
  Lead as LeadRow,
  Note as NoteRow,
} from '../../generated/client';

export const toNoteDto = (row: NoteRow): NoteDto => ({
  id: row.id,
  text: row.text,
  leadId: row.leadId,
  createdAt: row.createdAt.toISOString(),
  updatedAt: row.updatedAt.toISOString(),
});

export const toActivityDto = (row: ActivityRow): ActivityDto => ({
  id: row.id,
  leadId: row.leadId,
  createdAt: row.createdAt.toISOString(),
  type: row.type,
  description: row.description,
  userId: row.userId,
  userName: row.userName,
});

export const toLeadDto = (row: LeadRow): LeadDto => ({
  id: row.id,
  name: row.name,
  email: row.email,
  phone: row.phone ?? null,
  company: row.company,
  status: row.status,
  tags: row.tags,
  notes: row.notes ?? null,
  source: row.source ?? null,
  createdAt: row.createdAt.toISOString(),
  statusChangedAt: row.statusChangedAt.toISOString(),
  closedAt: row.closedAt?.toISOString() ?? null,
  closedById: row.closedById,
  assignedToId: row.assignedToId,
  assignedToName: row.assignedToName ?? null,
});
