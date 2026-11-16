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

@Entity('Activity')
export class ActivityEntity {
  @PrimaryColumn({ type: 'text', primaryKeyConstraintName: 'Activity_pkey' })
  id: string;

  @BeforeInsert()
  generateId() {
    if (!this.id) {
      this.id = randomUUID();
    }
  }

  @Column({ type: 'text' })
  leadId: string;

  @ManyToOne(() => LeadEntity, { onDelete: 'CASCADE', onUpdate: 'CASCADE' })
  @JoinColumn({
    name: 'leadId',
    foreignKeyConstraintName: 'Activity_leadId_fkey',
  })
  lead: LeadEntity;

  @Column({ type: 'text' })
  type: string;

  @Column({ type: 'text' })
  description: string;

  @CreateDateColumn({ type: 'timestamp', precision: 3 })
  createdAt: Date;

  @Column({ type: 'text', nullable: true })
  userId: string | null;

  @Column({ type: 'text', default: '' })
  userName: string;
}
