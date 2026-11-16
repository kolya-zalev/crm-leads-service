import {
  BeforeInsert,
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryColumn,
} from 'typeorm';
import { randomUUID } from 'node:crypto';
import { LeadEntity } from '../leads/lead.entity';

@Entity('Note')
export class NoteEntity {
  @PrimaryColumn({ type: 'text', primaryKeyConstraintName: 'Note_pkey' })
  id: string;

  @BeforeInsert()
  generateId() {
    if (!this.id) {
      this.id = randomUUID();
    }
  }

  @Column({ type: 'text' })
  text: string;

  @Column({ type: 'text' })
  leadId: string;

  @ManyToOne(() => LeadEntity, { onDelete: 'CASCADE', onUpdate: 'CASCADE' })
  @JoinColumn({ name: 'leadId', foreignKeyConstraintName: 'Note_leadId_fkey' })
  lead: LeadEntity;

  @CreateDateColumn({ type: 'timestamp', precision: 3 })
  createdAt: Date;

  @Column({
    type: 'timestamp',
    precision: 3,
    default: () => 'CURRENT_TIMESTAMP',
  })
  updatedAt: Date;
}
