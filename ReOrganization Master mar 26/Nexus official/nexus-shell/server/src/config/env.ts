import { z } from 'zod';

const envSchema = z.object({
  NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
  PORT: z.coerce.number().default(3000),
  HOST: z.string().default('0.0.0.0'),
  LOG_LEVEL: z.enum(['fatal', 'error', 'warn', 'info', 'debug', 'trace']).default('info'),
  DATABASE_URL: z.string().default('postgresql://localhost:5432/nexus_shell'),
  REDIS_URL: z.string().default('redis://localhost:6379'),
  JWT_SECRET: z.string().default('nexus-dev-secret-change-in-production'),
  JWT_EXPIRY: z.string().default('24h'),
  CORS_ORIGINS: z.string().default('*'),
  RATE_LIMIT_MAX: z.coerce.number().default(100),
  RATE_LIMIT_WINDOW: z.string().default('1 minute'),
  VERSION: z.string().default('0.1.0'),
});

export type EnvConfig = z.infer<typeof envSchema>;

export interface AppConfig {
  nodeEnv: string;
  port: number;
  host: string;
  logLevel: string;
  databaseUrl: string;
  redisUrl: string;
  jwtSecret: string;
  jwtExpiry: string;
  corsOrigins: string[];
  rateLimitMax: number;
  rateLimitWindow: string;
  version: string;
}

export function loadConfig(): AppConfig {
  const env = envSchema.parse(process.env);
  return {
    nodeEnv: env.NODE_ENV,
    port: env.PORT,
    host: env.HOST,
    logLevel: env.LOG_LEVEL,
    databaseUrl: env.DATABASE_URL,
    redisUrl: env.REDIS_URL,
    jwtSecret: env.JWT_SECRET,
    jwtExpiry: env.JWT_EXPIRY,
    corsOrigins: env.CORS_ORIGINS.split(',').map(s => s.trim()),
    rateLimitMax: env.RATE_LIMIT_MAX,
    rateLimitWindow: env.RATE_LIMIT_WINDOW,
    version: env.VERSION,
  };
}
