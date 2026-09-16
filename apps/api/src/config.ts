// Read lazily: main.ts loads the root .env before the Nest application is created.

export function postgresConfig() {
  return {
    host: process.env.POSTGRES_HOST ?? 'localhost',
    port: Number(process.env.POSTGRES_PORT ?? 5432),
    username: process.env.POSTGRES_USER ?? 'sonrisa',
    password: process.env.POSTGRES_PASSWORD ?? 'change-me',
    database: process.env.POSTGRES_DB ?? 'sonrisa_alerts',
  };
}

export interface SmtpConfig {
  host: string | undefined;
  port: number;
  user: string | undefined;
  pass: string | undefined;
  from: string;
}

export function smtpConfig(): SmtpConfig {
  return {
    // An empty SMTP_HOST counts as unset, so the email channel stays in dry-run mode.
    host: process.env.SMTP_HOST || undefined,
    port: Number(process.env.SMTP_PORT ?? 587),
    user: process.env.SMTP_USER || undefined,
    pass: process.env.SMTP_PASS || undefined,
    from: process.env.SMTP_FROM || 'alerts@example.com',
  };
}
