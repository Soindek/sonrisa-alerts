import { Injectable, Logger, OnApplicationBootstrap } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { AlertRule } from '../entities/alert-rule.entity.js';
import { User } from '../entities/user.entity.js';

@Injectable()
export class SeedService implements OnApplicationBootstrap {
  private readonly logger = new Logger(SeedService.name);

  constructor(
    @InjectRepository(User) private readonly users: Repository<User>,
    @InjectRepository(AlertRule) private readonly rules: Repository<AlertRule>,
  ) {}

  async onApplicationBootstrap(): Promise<void> {
    if ((await this.users.count()) > 0) return;

    const anna = await this.users.save(this.users.create({ name: 'Anna Kovács', email: 'anna@example.com' }));
    const bence = await this.users.save(this.users.create({ name: 'Bence Tóth', email: 'bence@example.com' }));

    // Saved one by one so createdAt, and with it "first matching rule", follows this order.
    // Anna's two rules both match a severe flood event on email: one delivery, ruleId of the first.
    const rules: Partial<AlertRule>[] = [
      { userId: anna.id, eventTypes: ['disaster'], minSeverity: 3, keywords: ['árvíz', 'flood'], channels: ['email'] },
      { userId: anna.id, eventTypes: [], minSeverity: 4, keywords: [], channels: ['email'] },
      { userId: bence.id, eventTypes: ['market'], minSeverity: 2, keywords: ['interest rate'], channels: ['email'] },
    ];
    for (const rule of rules) {
      await this.rules.save(this.rules.create(rule));
    }

    this.logger.log(`Seeded 2 users and ${rules.length} rules`);
  }
}
