import { Logger } from '@nestjs/common';
import type { FindOperator, Repository } from 'typeorm';
import { ChannelRegistry } from '../channels/channel-registry.js';
import type { NotificationChannel } from '../channels/notification-channel.js';
import type { AlertRule } from '../entities/alert-rule.entity.js';
import type { Delivery } from '../entities/delivery.entity.js';
import type { Event } from '../entities/event.entity.js';
import type { User } from '../entities/user.entity.js';
import { AlertPipelineService } from './alert-pipeline.service.js';
import type { CreateEventDto } from './create-event.dto.js';

const dto: CreateEventDto = {
  type: 'market',
  severity: 3,
  title: 'Interest rate hike',
  summary: 'The central bank raised rates.',
};

const bence: User = { id: 'u1', name: 'Bence Tóth', email: 'bence@example.com' };

function rule(overrides: Partial<AlertRule>): AlertRule {
  return {
    id: 'r1',
    userId: bence.id,
    eventTypes: [],
    minSeverity: 1,
    keywords: [],
    channels: ['email'],
    createdAt: new Date('2026-09-16T00:00:00.000Z'),
    ...overrides,
  };
}

function channel(id: string, send: NotificationChannel['send']): NotificationChannel {
  return { id, send };
}

interface Setup {
  rules: AlertRule[];
  users?: User[];
  channels: NotificationChannel[];
  saveDelivery?: (delivery: Delivery) => Promise<Delivery>;
}

function setup({ rules, users = [bence], channels, saveDelivery = (delivery) => Promise.resolve(delivery) }: Setup) {
  const saved: Delivery[] = [];

  const events = {
    create: (data: Partial<Event>) => data,
    save: (data: Partial<Event>) => Promise.resolve({ ...data, id: 'e1' } as Event),
  };
  const ruleRepo = {
    find: () => Promise.resolve(rules),
  };
  const userRepo = {
    findBy: ({ id }: { id: FindOperator<string[]> }) =>
      Promise.resolve(users.filter((user) => (id.value as string[]).includes(user.id))),
  };
  const deliveries = {
    create: (data: Partial<Delivery>) => data as Delivery,
    save: async (delivery: Delivery) => {
      const row = await saveDelivery(delivery);
      saved.push(row);
      return row;
    },
  };

  const service = new AlertPipelineService(
    events as unknown as Repository<Event>,
    ruleRepo as unknown as Repository<AlertRule>,
    userRepo as unknown as Repository<User>,
    deliveries as unknown as Repository<Delivery>,
    new ChannelRegistry(channels),
  );
  return { service, saved };
}

let logError: ReturnType<typeof vi.spyOn>;

beforeEach(() => {
  logError = vi.spyOn(Logger.prototype, 'error').mockImplementation(() => undefined);
});

afterEach(() => {
  vi.restoreAllMocks();
});

describe('AlertPipelineService', () => {
  it('saves a row for a working and a throwing channel with dry-run and failed statuses', async () => {
    const { service, saved } = setup({
      rules: [rule({ channels: ['email', 'slack'] })],
      channels: [
        channel('email', () => Promise.resolve({ status: 'dry-run' })),
        channel('slack', () => Promise.reject(new Error('webhook down'))),
      ],
    });

    const result = await service.process(dto);

    expect(saved).toHaveLength(2);
    expect(result.deliveries).toMatchObject([
      { eventId: 'e1', userId: 'u1', ruleId: 'r1', channel: 'email', status: 'dry-run', error: null },
      { eventId: 'e1', userId: 'u1', ruleId: 'r1', channel: 'slack', status: 'failed', error: 'webhook down' },
    ]);
  });

  it('saves a failed row for an unknown channel id', async () => {
    const { service } = setup({ rules: [rule({ channels: ['sms'] })], channels: [] });

    const result = await service.process(dto);

    expect(result.deliveries).toMatchObject([{ channel: 'sms', status: 'failed', error: 'Unknown channel: sms' }]);
  });

  it('saves a failed row when the recipient user is missing', async () => {
    const send = vi.fn<NotificationChannel['send']>();
    const { service } = setup({ rules: [rule({})], users: [], channels: [{ id: 'email', send }] });

    const result = await service.process(dto);

    expect(result.deliveries).toMatchObject([{ channel: 'email', status: 'failed' }]);
    expect(send).not.toHaveBeenCalled();
  });

  it('keeps delivering when saving one row throws, and resolves with the saved rows', async () => {
    const slackSend = vi.fn<NotificationChannel['send']>().mockResolvedValue({ status: 'sent' });
    const { service, saved } = setup({
      rules: [rule({ channels: ['email', 'slack'] })],
      channels: [channel('email', () => Promise.resolve({ status: 'sent' })), { id: 'slack', send: slackSend }],
      saveDelivery: (delivery) =>
        delivery.channel === 'email' ? Promise.reject(new Error('connection lost')) : Promise.resolve(delivery),
    });

    const result = await service.process(dto);

    expect(slackSend).toHaveBeenCalledOnce();
    expect(saved).toMatchObject([{ channel: 'slack', status: 'sent' }]);
    expect(result.deliveries).toMatchObject([{ channel: 'slack', status: 'sent' }]);
    expect(logError).toHaveBeenCalledWith(expect.stringContaining('connection lost'));
  });
});
