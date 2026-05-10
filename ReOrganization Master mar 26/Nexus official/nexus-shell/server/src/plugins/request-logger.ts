import type { FastifyPluginAsync } from 'fastify';

export const requestLogger: FastifyPluginAsync = async (app) => {
  app.addHook('onRequest', async (request) => {
    request.log.info({
      method: request.method,
      url: request.url,
      reqId: request.id,
    }, 'incoming request');
  });

  app.addHook('onResponse', async (request, reply) => {
    request.log.info({
      method: request.method,
      url: request.url,
      statusCode: reply.statusCode,
      responseTime: reply.elapsedTime,
    }, 'request completed');
  });
};
