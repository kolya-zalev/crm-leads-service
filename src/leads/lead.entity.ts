import {
  Column,
  CreateDateColumn,
  Entity,
  PrimaryColumn,
  Index,
  BeforeInsert,
} from 'typeorm';
import { randomUUID } from 'node:crypto';

@Entity('Lead')
@Index('Lead_status_statusChangedAt_idx', ['status', 'statusChangedAt'])
@Index('Lead_closedById_idx', ['closedById'])
@Index('Lead_assignedToId_idx', ['assignedToId'])
export class LeadEntity {
  @PrimaryColumn({ type: 'text', primaryKeyConstraintName: 'Lead_pkey' })
  id: string;

  @BeforeInsert()
  generateId() {
    if (!this.id) {
      this.id = randomUUID();
    }
  }

  @Column({ type: 'text' })
  name: string;

  @Column({ type: 'text' })
  email: string;

  @Column({ type: 'text', nullable: true })
  phone: string | null;

  @Column({ type: 'text' })
  company: string;

  @Column({ type: 'text', default: 'new' })
  status: string;

  @Column({ type: 'text', array: true, nullable: true })
  tags: string[] | null;

  @Column({ type: 'text', nullable: true })
  notes: string | null;

  @Column({ type: 'text', nullable: true })
  source: string | null;

  @CreateDateColumn({ type: 'timestamp', precision: 3 })
  createdAt: Date;

  @Column({
    type: 'timestamp',
    precision: 3,
    default: () => 'CURRENT_TIMESTAMP',
  })
  statusChangedAt: Date;

  @Column({ type: 'timestamp', precision: 3, nullable: true })
  closedAt: Date | null;

  @Column({ type: 'text', nullable: true })
  closedById: string | null;

  @Column({ type: 'text', nullable: true })
  assignedToId: string | null;

  @Column({ type: 'text', nullable: true })
  assignedToName: string | null;
}
