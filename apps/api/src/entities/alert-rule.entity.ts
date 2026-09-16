import { Column, CreateDateColumn, Entity, PrimaryGeneratedColumn } from 'typeorm';
import type { EventType } from '../matching/event-type.js';

@Entity('alert_rules')
export class AlertRule {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid' })
  userId: string;

  @Column({ type: 'text', array: true, default: '{}' })
  eventTypes: EventType[];

  @Column({ type: 'smallint' })
  minSeverity: number;

  @Column({ type: 'text', array: true, default: '{}' })
  keywords: string[];

  @Column({ type: 'text', array: true, default: '{}' })
  channels: string[];

  @CreateDateColumn({ type: 'timestamptz' })
  createdAt: Date;
}
