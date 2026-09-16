import { Logger } from '@nestjs/common';
import type { Event } from '../entities/event.entity.js';
import type { User } from '../entities/user.entity.js';
import { SlackChannel } from './slack.channel.js';

function eventWithTitle(title: string): Event {
  return {
    id: 'e1',
    type: 'market',
    severity: 3,
    title,
    summary: 'The central bank raised rates.',
    tags: ['rates'],
    payload: {},
    occurredAt: new Date('2026-09-16T12:00:00.000Z'),
  } as Event;
}

const event = eventWithTitle('Interest rate hike');

const user: User = { id: 'u1', name: 'Bence Tóth', email: 'bence@example.com' };

const webhookUrl = 'https://hooks.slack.test/services/T/B/X';

afterEach(() => {
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
});

describe('SlackChannel', () => {
  it('returns dry-run without a webhook URL and does not call fetch', async () => {
    vi.spyOn(Logger.prototype, 'log').mockImplementation(() => undefined);
    const fetchMock = vi.fn();
    vi.stubGlobal('fetch', fetchMock);

    await expect(new SlackChannel({ webhookUrl: undefined }).send({ event, user })).resolves.toEqual({
      status: 'dry-run',
    });

    expect(fetchMock).not.toHaveBeenCalled();
  });

  it('returns sent on 200 and posts the title and recipient email', async () => {
    const fetchMock = vi.fn().mockResolvedValue(new Response('ok', { status: 200 }));
    vi.stubGlobal('fetch', fetchMock);

    await expect(new SlackChannel({ webhookUrl }).send({ event, user })).resolves.toEqual({ status: 'sent' });

    expect(fetchMock).toHaveBeenCalledOnce();
    const [url, init] = fetchMock.mock.calls[0] as [string, RequestInit];
    expect(url).toBe(webhookUrl);
    expect(init.signal).toBeInstanceOf(AbortSignal);
    const { text } = JSON.parse(init.body as string) as { text: string };
    expect(text).toContain('*[market · severity 3]* Interest rate hike');
    expect(text).toContain('bence@example.com');
  });

  it('escapes Slack control characters in the title', async () => {
    const fetchMock = vi.fn().mockResolvedValue(new Response('ok', { status: 200 }));
    vi.stubGlobal('fetch', fetchMock);

    await new SlackChannel({ webhookUrl }).send({ event: eventWithTitle('<!channel> & <https://x|y>'), user });

    const [, init] = fetchMock.mock.calls[0] as [string, RequestInit];
    const { text } = JSON.parse(init.body as string) as { text: string };
    expect(text).toContain('*[market · severity 3]* &lt;!channel&gt; &amp; &lt;https://x|y&gt;');
    expect(text).not.toContain('<!channel>');
  });

  it('rejects when fetch rejects', async () => {
    vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new TypeError('fetch failed')));

    await expect(new SlackChannel({ webhookUrl }).send({ event, user })).rejects.toThrow('fetch failed');
  });

  it('throws with the status code on 500', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(new Response('server_error', { status: 500 })));

    await expect(new SlackChannel({ webhookUrl }).send({ event, user })).rejects.toThrow(
      'Slack webhook returned 500: server_error',
    );
  });
});
