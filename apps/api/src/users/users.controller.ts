import { Controller, Get } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { AlertRule } from '../entities/alert-rule.entity.js';
import { User } from '../entities/user.entity.js';

export interface UserWithRules extends User {
  rules: AlertRule[];
}

@Controller('users')
export class UsersController {
  constructor(
    @InjectRepository(User) private readonly users: Repository<User>,
    @InjectRepository(AlertRule) private readonly rules: Repository<AlertRule>,
  ) {}

  @Get()
  async list(): Promise<UserWithRules[]> {
    // Separate queries instead of relations (D23).
    const [users, rules] = await Promise.all([
      this.users.find({ order: { name: 'ASC', id: 'ASC' } }),
      this.rules.find({ order: { createdAt: 'ASC', id: 'ASC' } }),
    ]);

    return users.map((user) => ({
      id: user.id,
      name: user.name,
      email: user.email,
      rules: rules.filter((rule) => rule.userId === user.id),
    }));
  }
}
