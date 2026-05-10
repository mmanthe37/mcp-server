import type { FastifyPluginAsync } from 'fastify';
import { z } from 'zod';

const pairSchema = z.object({
  machineId: z.string(),
  pairingCode: z.string().length(6),
});

export const deviceRoutes: FastifyPluginAsync = async (app) => {
  app.get('/', async () => ({
    success: true,
    data: [],
    meta: { page: 1, perPage: 20, total: 0, hasMore: false },
  }));

  app.get('/machines', async () => ({
    success: true,
    data: [],
    meta: { page: 1, perPage: 20, total: 0, hasMore: false },
  }));

  app.post('/pair', async (request) => {
    const body = pairSchema.parse(request.body);
    return {
      success: true,
      data: {
        pairingId: 'pairing-id',
        machineId: body.machineId,
        status: 'pending_verification',
        expiresAt: new Date(Date.now() + 600000).toISOString(),
      },
    };
  });

  app.post('/pair/:id/verify', async (request) => ({
    success: true,
    data: { verified: true },
  }));

  app.delete('/:id', async (request) => ({
    success: true,
    data: { revoked: true },
  }));
};
