import {
  BadRequestException,
  Body,
  Controller,
  Delete,
  HttpCode,
  NotFoundException,
  Param,
  ParseUUIDPipe,
  Post,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ChannelRegistry } from '../channels/channel-registry.js';
import { AlertRule } from '../entities/alert-rule.entity.js';
import { User } from '../entities/user.entity.js';
import { CreateRuleDto } from './create-rule.dto.js';

@Controller('rules')
export class RulesController {
  constructor(
    @InjectRepository(AlertRule) private readonly rules: Repository<AlertRule>,
    @InjectRepository(User) private readonly users: Repository<User>,
    private readonly channels: ChannelRegistry,
  ) {}

  @Post()
  async create(@Body() dto: CreateRuleDto): Promise<AlertRule> {
    const registered = new Set(this.channels.ids());
    const unknown = dto.channels.filter((id) => !registered.has(id));
    if (unknown.length > 0) {
      throw new BadRequestException(`Unknown channels: ${unknown.join(', ')}`);
    }
    if (!(await this.users.existsBy({ id: dto.userId }))) {
      throw new NotFoundException(`User not found: ${dto.userId}`);
    }

    return this.rules.save(
      this.rules.create({
        userId: dto.userId,
        eventTypes: dto.eventTypes,
        minSeverity: dto.minSeverity,
        keywords: dto.keywords.map((keyword) => keyword.trim()).filter((keyword) => keyword.length > 0),
        channels: dto.channels,
      }),
    );
  }

  @Delete(':id')
  @HttpCode(204)
  async remove(@Param('id', ParseUUIDPipe) id: string): Promise<void> {
    const result = await this.rules.delete({ id });
    if (!result.affected) {
      throw new NotFoundException(`Rule not found: ${id}`);
    }
  }
}
