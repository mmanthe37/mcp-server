import type { FastifyPluginAsync } from 'fastify';
import { z } from 'zod';

const createSessionSchema = z.object({
  machineId: z.string(),
  shell: z.string().default('/bin/zsh'),
  cols: z.number().default(80),
  rows: z.number().default(24),
});

export const sessionRoutes: FastifyPluginAsync = async (app) => {
  app.get('/', async () => ({
    success: true,
    data: [],
    meta: { page: 1, perPage: 20, total: 0, hasMore: false },
  }));

  app.post('/', async (request) => {
    const body = createSessionSchema.parse(request.body);
    return {
      success: true,
      data: {
        id: `session-${Date.now()}`,
        machineId: body.machineId,
        status: 'creating',
        shell: body.shell,
        cols: body.cols,
        rows: body.rows,
        startedAt: new Date().toISOString(),
      },
    };
  });

  app.post('/:id/attach', async (request) => ({
    success: true,
    data: { sessionId: (request.params as any).id, status: 'active' },
  }));

  app.post('/:id/detach', async (request) => ({
    success: true,
    data: { sessionId: (request.params as any).id, status: 'suspended' },
  }));

  app.post('/:id/resume', async (request) => ({
    success: true,
    data: { sessionId: (request.params as any).id, status: 'active' },
  }));

  app.delete('/:id', async (request) => ({
    success: true,
    data: { sessionId: (request.params as any).id, status: 'terminated' },
  }));
};
