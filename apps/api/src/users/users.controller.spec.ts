import type { Repository } from 'typeorm';
import type { AlertRule } from '../entities/alert-rule.entity.js';
import type { User } from '../entities/user.entity.js';
import { UsersController } from './users.controller.js';

const anna: User = { id: 'u1', name: 'Anna', email: 'anna@example.com' };
const bence: User = { id: 'u2', name: 'Bence', email: 'bence@example.com' };

function rule(id: string, userId: string): AlertRule {
  return {
    id,
    userId,
    eventTypes: [],
    minSeverity: 1,
    keywords: [],
    channels: ['email'],
    createdAt: new Date('2026-09-16T10:00:00.000Z'),
  };
}

describe('UsersController', () => {
  it('attaches each user their rules, keeping the rule query order', async () => {
    const usersFind = vi.fn().mockResolvedValue([anna, bence]);
    const rulesFind = vi.fn().mockResolvedValue([rule('r1', 'u2'), rule('r2', 'u1'), rule('r3', 'u2')]);
    const controller = new UsersController(
      { find: usersFind } as unknown as Repository<User>,
      { find: rulesFind } as unknown as Repository<AlertRule>,
    );

    const result = await controller.list();

    expect(rulesFind).toHaveBeenCalledWith({ order: { createdAt: 'ASC', id: 'ASC' } });
    expect(result.map((user) => [user.id, user.rules.map((r) => r.id)])).toEqual([
      ['u1', ['r2']],
      ['u2', ['r1', 'r3']],
    ]);
  });
});
