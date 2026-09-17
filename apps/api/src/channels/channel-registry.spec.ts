import { ChannelRegistry } from './channel-registry.js';
import type { NotificationChannel } from './notification-channel.js';

function channel(id: string): NotificationChannel {
  return { id, send: () => Promise.resolve({ status: 'sent' }) };
}

describe('ChannelRegistry', () => {
  it('returns a registered channel by id', () => {
    const email = channel('email');
    const registry = new ChannelRegistry([email, channel('slack')]);

    expect(registry.get('email')).toBe(email);
  });

  it('returns undefined for an unknown id', () => {
    const registry = new ChannelRegistry([channel('email')]);

    expect(registry.get('sms')).toBeUndefined();
  });

  it('lists the registered ids in registration order', () => {
    const registry = new ChannelRegistry([channel('slack'), channel('email')]);

    expect(registry.ids()).toEqual(['slack', 'email']);
  });

  it('throws on duplicate ids', () => {
    expect(() => new ChannelRegistry([channel('email'), channel('email')])).toThrow(
      'Duplicate notification channel id: email',
    );
  });
});
