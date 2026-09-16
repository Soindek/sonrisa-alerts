import { Logger } from '@nestjs/common';
import type { Event } from '../entities/event.entity.js';
import type { User } from '../entities/user.entity.js';
import { EmailChannel } from './email.channel.js';

const event = {
  id: 'e1',
  type: 'market',
  severity: 3,
  title: 'Interest rate hike',
  summary: 'The central bank raised rates.',
  tags: ['rates'],
  payload: {},
  occurredAt: new Date('2026-09-16T12:00:00.000Z'),
} as Event;

const user: User = { id: 'u1', name: 'Bence Tóth', email: 'bence@example.com' };

afterEach(() => {
  vi.restoreAllMocks();
});

describe('EmailChannel', () => {
  it('returns dry-run without an SMTP host and logs the subject', async () => {
    const log = vi.spyOn(Logger.prototype, 'log').mockImplementation(() => undefined);
    const channel = new EmailChannel({
      host: undefined,
      port: 587,
      user: undefined,
      pass: undefined,
      from: 'alerts@example.com',
    });

    await expect(channel.send({ event, user })).resolves.toEqual({ status: 'dry-run' });

    expect(log).toHaveBeenCalledOnce();
    expect(log.mock.calls[0][0]).toContain('Subject: [market · severity 3] Interest rate hike');
  });
});
