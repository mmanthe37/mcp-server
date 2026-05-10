import Fastify from 'fastify';
import cors from '@fastify/cors';
import helmet from '@fastify/helmet';
import rateLimit from '@fastify/rate-limit';
import websocket from '@fastify/websocket';
import { loadConfig } from './config/env.js';
import { healthRoutes } from './routes/health.js';
import { authRoutes } from './routes/auth.js';
import { deviceRoutes } from './routes/devices.js';
import { sessionRoutes } from './routes/sessions.js';
import { policyRoutes } from './routes/policies.js';
import { realtimeGateway } from './realtime/gateway.js';
import { errorHandler } from './plugins/error-handler.js';
import { requestLogger } from './plugins/request-logger.js';

export async function buildApp() {
  const config = loadConfig();

  const app = Fastify({
    logger: {
      level: config.logLevel,
      transport: config.nodeEnv === 'development'
        ? { target: 'pino-pretty', options: { colorize: true } }
        : undefined,
    },
  });

  // Security plugins
  await app.register(helmet);
  await app.register(cors, { origin: config.corsOrigins, credentials: true });
  await app.register(rateLimit, {
    max: config.rateLimitMax,
    timeWindow: config.rateLimitWindow,
  });

  // WebSocket support
  await app.register(websocket);

  // Custom plugins
  await app.register(errorHandler);
  await app.register(requestLogger);

  // REST routes
  await app.register(healthRoutes, { prefix: '/api/v1' });
  await app.register(authRoutes, { prefix: '/api/v1/auth' });
  await app.register(deviceRoutes, { prefix: '/api/v1/devices' });
  await app.register(sessionRoutes, { prefix: '/api/v1/sessions' });
  await app.register(policyRoutes, { prefix: '/api/v1/policies' });

  // WebSocket realtime gateway
  await app.register(realtimeGateway, { prefix: '/ws' });

  return app;
}

async function start() {
  const config = loadConfig();
  const app = await buildApp();

  try {
    await app.listen({ port: config.port, host: config.host });
    app.log.info(`NexusShell server v${config.version} listening on ${config.host}:${config.port}`);
  } catch (err) {
    app.log.error(err);
    process.exit(1);
  }
}

start();
