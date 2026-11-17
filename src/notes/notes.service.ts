import { Injectable, NotFoundException } from '@nestjs/common';
import type {
  CreateNotePayload,
  LeadIdPayload,
  NoteDto,
  OkResponse,
  RemoveNotePayload,
} from '@crm/shared';
import { toNoteDto } from '../leads/leads.mapper';
import { InjectRepository } from '@nestjs/typeorm';
import { NoteEntity } from './note.entity';
import { DataSource, Repository } from 'typeorm';
import { LeadEntity } from '../leads/lead.entity';
import { ActivityEntity } from '../activities/activity.entity';

@Injectable()
export class NotesService {
  constructor(
    @InjectRepository(NoteEntity)
    private readonly notes: Repository<NoteEntity>,
    private readonly dataSource: DataSource,
  ) {}

  async findByLead({ leadId }: LeadIdPayload): Promise<NoteDto[]> {
    const notes = await this.notes.find({
      where: { leadId },
      order: { createdAt: 'desc' },
    });
    return notes.map(toNoteDto);
  }

  async create({ actor, leadId, text }: CreateNotePayload): Promise<NoteDto> {
    const note = await this.dataSource.transaction(async (manager) => {
      const leadExists = await manager.existsBy(LeadEntity, { id: leadId });
      if (!leadExists) {
        throw new NotFoundException(`Lead ${leadId} not found`);
      }

      const createdNote = await manager.save(
        manager.create(NoteEntity, { leadId, text }),
      );

      await manager.save(
        manager.create(ActivityEntity, {
          leadId,
          type: 'note_added',
          description: 'Note added',
          userId: actor.id,
          userName: actor.name,
        }),
      );

      return createdNote;
    });

    return toNoteDto(note);
  }

  async remove({
    actor,
    leadId,
    noteId,
  }: RemoveNotePayload): Promise<OkResponse> {
    const note = await this.notes.findOneBy({ id: noteId, leadId });
    if (!note) throw new NotFoundException(`Note ${noteId} not found`);

    await this.dataSource.transaction(async (manager) => {
      await manager.delete(NoteEntity, { id: noteId });

      await manager.save(
        manager.create(ActivityEntity, {
          leadId,
          type: 'note_deleted',
          description: 'Note deleted',
          userId: actor.id,
          userName: actor.name,
        }),
      );
    });

    return { ok: true };
  }
}
