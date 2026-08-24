import { registerAs } from '@nestjs/config';

function toNumber(value: string | undefined, defaultValue: number): number {
  const parsedValue = Number(value);

  return Number.isFinite(parsedValue) ? parsedValue : defaultValue;
}

export function isDbEnabled(env: NodeJS.ProcessEnv = process.env): boolean {
  return env.ENABLE_DB === 'true';
}

export default registerAs('app', () => ({
  port: toNumber(process.env.PORT, 3000),
  enableDb: isDbEnabled(),
  db: {
    host: process.env.DB_HOST || 'localhost',
    port: toNumber(process.env.DB_PORT, 5432),
    username: process.env.DB_USERNAME || 'postgres',
    password: process.env.DB_PASSWORD || 'password',
    database: process.env.DB_NAME || 'nestjs_db',
  },
}));
