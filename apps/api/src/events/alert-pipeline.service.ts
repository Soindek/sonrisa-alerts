import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { In, Repository } from 'typeorm';
import { ChannelRegistry } from '../channels/channel-registry.js';
import { AlertRule } from '../entities/alert-rule.entity.js';
import { Delivery, type DeliveryStatus } from '../entities/delivery.entity.js';
import { Event } from '../entities/event.entity.js';
import { User } from '../entities/user.entity.js';
import { planDeliveries } from '../matching/plan-deliveries.js';
import type { CreateEventDto } from './create-event.dto.js';

interface DeliveryOutcome {
  status: DeliveryStatus;
  error: string | null;
}

@Injectable()
export class AlertPipelineService {
  private readonly logger = new Logger(AlertPipelineService.name);

  constructor(
    @InjectRepository(Event) private readonly events: Repository<Event>,
    @InjectRepository(AlertRule) private readonly rules: Repository<AlertRule>,
    @InjectRepository(User) private readonly users: Repository<User>,
    @InjectRepository(Delivery) private readonly deliveries: Repository<Delivery>,
    private readonly channels: ChannelRegistry,
  ) {}

  async process(dto: CreateEventDto): Promise<{ event: Event; deliveries: Delivery[] }> {
    const event = await this.events.save(
      this.events.create({
        type: dto.type,
        severity: dto.severity,
        title: dto.title,
        summary: dto.summary,
        tags: dto.tags ?? [],
        payload: dto.payload ?? {},
        occurredAt: dto.occurredAt ? new Date(dto.occurredAt) : new Date(),
      }),
    );

    const rules = await this.rules.find({ order: { createdAt: 'ASC', id: 'ASC' } });
    const planned = planDeliveries(event, rules);

    const userIds = [...new Set(planned.map((plan) => plan.userId))];
    const users = userIds.length > 0 ? await this.users.findBy({ id: In(userIds) }) : [];
    const usersById = new Map(users.map((user) => [user.id, user]));

    const deliveries: Delivery[] = [];
    for (const plan of planned) {
      const outcome = await this.deliver(event, usersById.get(plan.userId), plan.channel);
      try {
        deliveries.push(await this.deliveries.save(this.deliveries.create({ eventId: event.id, ...plan, ...outcome })));
      } catch (err) {
        // A lost log row must not fail the request or the remaining deliveries.
        this.logger.error(
          `Failed to save delivery: event ${event.id}, user ${plan.userId}, channel ${plan.channel}: ${errorMessage(err)}`,
        );
      }
    }

    return { event, deliveries };
  }

  private async deliver(event: Event, user: User | undefined, channelId: string): Promise<DeliveryOutcome> {
    const channel = this.channels.get(channelId);
    if (!channel) {
      return { status: 'failed', error: `Unknown channel: ${channelId}` };
    }
    if (!user) {
      return { status: 'failed', error: 'Recipient user not found' };
    }

    try {
      const result = await channel.send({ event, user });
      return { status: result.status, error: null };
    } catch (err) {
      const error = errorMessage(err);
      this.logger.warn(`Send failed: event ${event.id}, user ${user.id}, channel ${channelId}: ${error}`);
      return { status: 'failed', error };
    }
  }
}

function errorMessage(err: unknown): string {
  return err instanceof Error ? err.message : String(err);
}
