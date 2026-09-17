import { Controller, Get } from '@nestjs/common';
import { ChannelRegistry } from './channel-registry.js';

@Controller('channels')
export class ChannelsController {
  constructor(private readonly registry: ChannelRegistry) {}

  @Get()
  list(): string[] {
    return this.registry.ids();
  }
}
