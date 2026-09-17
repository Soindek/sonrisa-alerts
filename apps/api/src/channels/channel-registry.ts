import { Inject, Injectable } from '@nestjs/common';
import { NOTIFICATION_CHANNELS, type NotificationChannel } from './notification-channel.js';

@Injectable()
export class ChannelRegistry {
  private readonly channels = new Map<string, NotificationChannel>();

  constructor(@Inject(NOTIFICATION_CHANNELS) channels: NotificationChannel[]) {
    for (const channel of channels) {
      if (this.channels.has(channel.id)) {
        throw new Error(`Duplicate notification channel id: ${channel.id}`);
      }
      this.channels.set(channel.id, channel);
    }
  }

  get(id: string): NotificationChannel | undefined {
    return this.channels.get(id);
  }

  /** Registered ids in registration order. */
  ids(): string[] {
    return [...this.channels.keys()];
  }
}
