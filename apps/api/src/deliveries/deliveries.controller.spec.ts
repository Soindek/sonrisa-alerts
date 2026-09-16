import type { FindOperator, Repository } from 'typeorm';
import type { Delivery } from '../entities/delivery.entity.js';
import type { Event } from '../entities/event.entity.js';
import type { User } from '../entities/user.entity.js';
import { DeliveriesController } from './deliveries.controller.js';

const flood: Event = {
  id: 'e1',
  type: 'disaster',
  severity: 4,
  title: 'Flood warning',
  summary: 'River levels rising.',
  tags: ['flood'],
  payload: {},
  occurredAt: new Date('2026-09-16T10:00:00.000Z'),
};

const anna: User = { id: 'u1', name: 'Anna Kiss', email: 'anna@example.com' };

function delivery(id: string, eventId: string, userId: string): Delivery {
  return {
    id,
    eventId,
    userId,
    ruleId: 'r1',
    channel: 'email',
    status: 'dry-run',
    error: null,
    createdAt: new Date('2026-09-16T10:00:01.000Z'),
  };
}

function byIds<T extends { id: string }>(items: T[]) {
  return {
    findBy: ({ id }: { id: FindOperator<string[]> }) =>
      Promise.resolve(items.filter((item) => (id.value as string[]).includes(item.id))),
  };
}

function setup(rows: Delivery[], events: Event[], users: User[]) {
  const find = vi.fn().mockResolvedValue(rows);
  const controller = new DeliveriesController(
    { find } as unknown as Repository<Delivery>,
    byIds(events) as unknown as Repository<Event>,
    byIds(users) as unknown as Repository<User>,
  );
  return { controller, find };
}

describe('DeliveriesController', () => {
  it('reads the latest 100 rows, newest first', async () => {
    const { controller, find } = setup([], [], []);

    await controller.list();

    expect(find).toHaveBeenCalledWith({ order: { createdAt: 'DESC' }, take: 100 });
  });

  it('enriches each row with its event and user summary', async () => {
    const { controller } = setup([delivery('d1', 'e1', 'u1')], [flood], [anna]);

    const result = await controller.list();

    expect(result).toEqual([
      Object.assign(delivery('d1', 'e1', 'u1'), {
        event: { title: 'Flood warning', type: 'disaster', severity: 4 },
        user: { name: 'Anna Kiss', email: 'anna@example.com' },
      }),
    ]);
  });

  it('yields null for a missing event or user', async () => {
    const { controller } = setup([delivery('d1', 'e-gone', 'u1'), delivery('d2', 'e1', 'u-gone')], [flood], [anna]);

    const result = await controller.list();

    expect(result).toMatchObject([
      { id: 'd1', event: null, user: { name: 'Anna Kiss' } },
      { id: 'd2', event: { title: 'Flood warning' }, user: null },
    ]);
  });
});
