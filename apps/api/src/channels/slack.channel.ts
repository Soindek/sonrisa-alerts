import { Logger } from '@nestjs/common';
import { slackConfig, type SlackConfig } from '../config.js';
import type { DeliveryResult, MatchedAlert, NotificationChannel } from './notification-channel.js';

const TIMEOUT_MS = 5000;

/** Posts to one workspace-level incoming webhook, so the text names the recipient. */
export class SlackChannel implements NotificationChannel {
  readonly id = 'slack';

  private readonly logger = new Logger(SlackChannel.name);

  constructor(private readonly config: SlackConfig = slackConfig()) {}

  async send(alert: MatchedAlert): Promise<DeliveryResult> {
    const text = renderText(alert);

    if (!this.config.webhookUrl) {
      this.logger.log(`[dry-run] ${text}`);
      return { status: 'dry-run' };
    }

    const response = await fetch(this.config.webhookUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ text }),
      signal: AbortSignal.timeout(TIMEOUT_MS),
    });
    if (!response.ok) {
      throw new Error(`Slack webhook returned ${response.status}: ${await response.text()}`);
    }
    return { status: 'sent' };
  }
}

function renderText({ event, user }: MatchedAlert): string {
  const tags = event.tags.length > 0 ? event.tags.map(escape).join(', ') : '(none)';
  return (
    `*[${event.type} · severity ${event.severity}]* ${escape(event.title)}\n` +
    `${escape(event.summary)}\n` +
    `Tags: ${tags}\n` +
    `Occurred at: ${event.occurredAt.toISOString()}\n` +
    `For: ${escape(user.name)} ${escape(user.email)}`
  );
}

/** Slack reads <...> as mentions and links, so event text must not be able to produce them. */
function escape(text: string): string {
  return text.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}
