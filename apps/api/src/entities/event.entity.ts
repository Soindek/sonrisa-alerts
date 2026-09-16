import { Column, Entity, PrimaryGeneratedColumn } from 'typeorm';
import type { EventType } from '../matching/event-type.js';

@Entity('events')
export class Event {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'text' })
  type: EventType;

  @Column({ type: 'smallint' })
  severity: number;

  @Column({ type: 'text' })
  title: string;

  @Column({ type: 'text' })
  summary: string;

  @Column({ type: 'text', array: true, default: '{}' })
  tags: string[];

  @Column({ type: 'jsonb', default: {} })
  payload: Record<string, unknown>;

  @Column({ type: 'timestamptz' })
  occurredAt: Date;
}
