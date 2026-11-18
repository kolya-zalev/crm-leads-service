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
import { Repository } from 'typeorm';
import { LeadEntity } from '../leads/lead.entity';

@Injectable()
export class NotesService {
  constructor(
    @InjectRepository(NoteEntity)
    private readonly notes: Repository<NoteEntity>,
    @InjectRepository(LeadEntity)
    private readonly leads: Repository<LeadEntity>,
  ) {}

  async findByLead({ leadId }: LeadIdPayload): Promise<NoteDto[]> {
    const notes = await this.notes.find({
      where: { leadId },
      order: { createdAt: 'desc' },
    });
    return notes.map(toNoteDto);
  }

  async create({ leadId, text }: CreateNotePayload): Promise<NoteDto> {
    const leadExists = await this.leads.existsBy({ id: leadId });
    if (!leadExists) {
      throw new NotFoundException(`Lead ${leadId} not found`);
    }

    const note = await this.notes.save(this.notes.create({ leadId, text }));

    return toNoteDto(note);
  }

  async remove({ leadId, noteId }: RemoveNotePayload): Promise<OkResponse> {
    const note = await this.notes.findOneBy({ id: noteId, leadId });
    if (!note) throw new NotFoundException(`Note ${noteId} not found`);

    await this.notes.delete({ id: noteId });

    return { ok: true };
  }
}
