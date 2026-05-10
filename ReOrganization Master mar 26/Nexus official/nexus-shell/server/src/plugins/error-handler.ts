import type { FastifyPluginAsync, FastifyError } from 'fastify';

export const errorHandler: FastifyPluginAsync = async (app) => {
  app.setErrorHandler((error: FastifyError, request, reply) => {
    const statusCode = error.statusCode ?? 500;
    const level = statusCode >= 500 ? 'error' : 'warn';

    request.log[level]({
      err: error,
      reqId: request.id,
      statusCode,
    });

    reply.status(statusCode).send({
      success: false,
      error: {
        code: error.code ?? 'INTERNAL_ERROR',
        message: statusCode >= 500 ? 'Internal server error' : error.message,
      },
    });
  });
};
