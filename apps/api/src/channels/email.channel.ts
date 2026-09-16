import { Logger } from '@nestjs/common';
import { createTransport, type Transporter } from 'nodemailer';
import { smtpConfig, type SmtpConfig } from '../config.js';
import type { Event } from '../entities/event.entity.js';
import type { DeliveryResult, MatchedAlert, NotificationChannel } from './notification-channel.js';

export class EmailChannel implements NotificationChannel {
  readonly id = 'email';

  private readonly logger = new Logger(EmailChannel.name);
  private readonly transporter: Transporter | null;

  constructor(private readonly config: SmtpConfig = smtpConfig()) {
    this.transporter = config.host
      ? createTransport({
          host: config.host,
          port: config.port,
          secure: config.port === 465,
          auth: config.user ? { user: config.user, pass: config.pass } : undefined,
        })
      : null;
  }

  async send({ event, user }: MatchedAlert): Promise<DeliveryResult> {
    const message = {
      from: this.config.from,
      to: user.email,
      subject: `[${event.type} · severity ${event.severity}] ${event.title}`,
      text: renderBody(event),
    };

    if (!this.transporter) {
      this.logger.log(
        `[dry-run] From: ${message.from}\nTo: ${message.to}\nSubject: ${message.subject}\n\n${message.text}`,
      );
      return { status: 'dry-run' };
    }

    await this.transporter.sendMail(message);
    return { status: 'sent' };
  }
}

function renderBody(event: Event): string {
  const tags = event.tags.length > 0 ? event.tags.join(', ') : '(none)';
  return `${event.summary}\n\nTags: ${tags}\nOccurred at: ${event.occurredAt.toISOString()}\n`;
}
