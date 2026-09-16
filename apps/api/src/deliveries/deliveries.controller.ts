import { Controller, Get } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { In, Repository } from 'typeorm';
import { Delivery } from '../entities/delivery.entity.js';
import { Event } from '../entities/event.entity.js';
import { User } from '../entities/user.entity.js';

export interface DeliveryLogEntry extends Delivery {
  event: Pick<Event, 'title' | 'type' | 'severity'> | null;
  user: Pick<User, 'name' | 'email'> | null;
}

@Controller('deliveries')
export class DeliveriesController {
  constructor(
    @InjectRepository(Delivery) private readonly deliveries: Repository<Delivery>,
    @InjectRepository(Event) private readonly events: Repository<Event>,
    @InjectRepository(User) private readonly users: Repository<User>,
  ) {}

  @Get()
  async list(): Promise<DeliveryLogEntry[]> {
    const rows = await this.deliveries.find({ order: { createdAt: 'DESC' }, take: 100 });
    if (rows.length === 0) {
      return [];
    }

    // Separate queries instead of relations (D23).
    const [events, users] = await Promise.all([
      this.events.findBy({ id: In([...new Set(rows.map((row) => row.eventId))]) }),
      this.users.findBy({ id: In([...new Set(rows.map((row) => row.userId))]) }),
    ]);
    const eventsById = new Map(events.map((event) => [event.id, event]));
    const usersById = new Map(users.map((user) => [user.id, user]));

    return rows.map((row) => {
      const event = eventsById.get(row.eventId);
      const user = usersById.get(row.userId);
      return {
        id: row.id,
        eventId: row.eventId,
        userId: row.userId,
        ruleId: row.ruleId,
        channel: row.channel,
        status: row.status,
        error: row.error,
        createdAt: row.createdAt,
        event: event ? { title: event.title, type: event.type, severity: event.severity } : null,
        user: user ? { name: user.name, email: user.email } : null,
      };
    });
  }
}
