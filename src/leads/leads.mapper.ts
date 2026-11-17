import type { ActivityDto, LeadDto, NoteDto } from '@crm/shared';
import type { LeadEntity } from './lead.entity';
import type { NoteEntity } from '../notes/note.entity';
import type { ActivityEntity } from '../activities/activity.entity';

export const toNoteDto = (row: NoteEntity): NoteDto => ({
  id: row.id,
  text: row.text,
  leadId: row.leadId,
  createdAt: row.createdAt.toISOString(),
  updatedAt: row.updatedAt.toISOString(),
});

export const toActivityDto = (row: ActivityEntity): ActivityDto => ({
  id: row.id,
  leadId: row.leadId,
  createdAt: row.createdAt.toISOString(),
  type: row.type,
  description: row.description,
  userId: row.userId,
  userName: row.userName,
});

export const toLeadDto = (row: LeadEntity): LeadDto => ({
  id: row.id,
  name: row.name,
  email: row.email,
  phone: row.phone ?? null,
  company: row.company,
  status: row.status,
  tags: row.tags ?? [],
  notes: row.notes ?? null,
  source: row.source ?? null,
  createdAt: row.createdAt.toISOString(),
  statusChangedAt: row.statusChangedAt.toISOString(),
  closedAt: row.closedAt?.toISOString() ?? null,
  closedById: row.closedById,
  assignedToId: row.assignedToId,
  assignedToName: row.assignedToName ?? null,
});
