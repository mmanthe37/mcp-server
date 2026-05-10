import type { FastifyPluginAsync } from 'fastify';

export const healthRoutes: FastifyPluginAsync = async (app) => {
  app.get('/health', async () => ({
    success: true,
    data: {
      status: 'ok',
      version: process.env.VERSION ?? '0.1.0',
      uptime: process.uptime(),
      timestamp: new Date().toISOString(),
    },
  }));

  app.get('/health/ready', async () => ({
    success: true,
    data: {
      status: 'ready',
      checks: {
        server: true,
      },
    },
  }));
};
