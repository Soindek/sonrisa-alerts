import { postgresConfig, slackConfig, smtpConfig } from './config.js';

const EMPTY_VARS = [
  'POSTGRES_HOST',
  'POSTGRES_PORT',
  'POSTGRES_USER',
  'POSTGRES_PASSWORD',
  'POSTGRES_DB',
  'SMTP_HOST',
  'SMTP_PORT',
  'SMTP_USER',
  'SMTP_PASS',
  'SMTP_FROM',
  'SLACK_WEBHOOK_URL',
];

beforeEach(() => {
  for (const name of EMPTY_VARS) {
    vi.stubEnv(name, '');
  }
});

afterEach(() => {
  vi.unstubAllEnvs();
});

describe('config with empty env vars', () => {
  it('postgresConfig falls back to the docker-compose defaults', () => {
    expect(postgresConfig()).toEqual({
      host: 'localhost',
      port: 5432,
      username: 'sonrisa',
      password: 'change-me',
      database: 'sonrisa_alerts',
    });
  });

  it('smtpConfig falls back to its defaults', () => {
    expect(smtpConfig()).toEqual({
      host: undefined,
      port: 587,
      user: undefined,
      pass: undefined,
      from: 'alerts@example.com',
    });
  });

  it('slackConfig treats an empty webhook URL as unset', () => {
    expect(slackConfig()).toEqual({ webhookUrl: undefined });
  });
});
