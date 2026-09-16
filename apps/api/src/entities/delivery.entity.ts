import { Column, CreateDateColumn, Entity, PrimaryGeneratedColumn } from 'typeorm';

export type DeliveryStatus = 'sent' | 'dry-run' | 'failed';

@Entity('deliveries')
export class Delivery {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid' })
  eventId: string;

  @Column({ type: 'uuid' })
  userId: string;

  @Column({ type: 'uuid' })
  ruleId: string;

  @Column({ type: 'text' })
  channel: string;

  @Column({ type: 'text' })
  status: DeliveryStatus;

  @Column({ type: 'text', nullable: true })
  error: string | null;

  @CreateDateColumn({ type: 'timestamptz' })
  createdAt: Date;
}
