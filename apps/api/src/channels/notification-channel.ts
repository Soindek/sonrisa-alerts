import type { DeliveryStatus } from '../entities/delivery.entity.js';
import type { Event } from '../entities/event.entity.js';
import type { User } from '../entities/user.entity.js';

export const NOTIFICATION_CHANNELS = Symbol('NOTIFICATION_CHANNELS');

export interface MatchedAlert {
  event: Event;
  user: User;
}

export interface DeliveryResult {
  status: Exclude<DeliveryStatus, 'failed'>;
}

/** A channel reports failure by throwing; the pipeline records it as a failed delivery. */
export interface NotificationChannel {
  readonly id: string;
  send(alert: MatchedAlert): Promise<DeliveryResult>;
}
