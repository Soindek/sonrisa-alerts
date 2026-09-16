import { Module } from '@nestjs/common';
import { ChannelRegistry } from './channel-registry.js';
import { EmailChannel } from './email.channel.js';
import { NOTIFICATION_CHANNELS, type NotificationChannel } from './notification-channel.js';

@Module({
  providers: [
    {
      provide: NOTIFICATION_CHANNELS,
      // Adding a channel: write the class, add one entry here.
      useFactory: (): NotificationChannel[] => [new EmailChannel()],
    },
    ChannelRegistry,
  ],
  exports: [ChannelRegistry],
})
export class ChannelsModule {}
